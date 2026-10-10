<?php

namespace Modules\Order\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Order\Models\Order;

class MidtransPaymentService
{
    private string $serverKey;
    private string $clientKey;
    private bool $isProduction;
    private string $snapBaseUrl;

    public function __construct()
    {
        $this->serverKey = (string) config('services.midtrans.server_key', '');
        $this->clientKey = (string) config('services.midtrans.client_key', '');
        $this->isProduction = (bool) config('services.midtrans.is_production', false);
        $this->snapBaseUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    /**
     * Generate Midtrans Snap Token & redirect URL for an order.
     *
     * @return array{token: string, redirect_url: string, client_key: string}
     */
    public function createSnapTransaction(Order $order, bool $forceRefresh = false): array
    {
        if (! $forceRefresh && ! empty($order->snap_token) && ! empty($order->snap_redirect_url)) {
            return [
                'token' => $order->snap_token,
                'redirect_url' => $order->snap_redirect_url,
                'client_key' => $this->clientKey,
            ];
        }

        $grossAmount = (int) round((float) $order->total_price);
        $orderId = $order->code . '-' . substr(str_replace('-', '', $order->uuid), 0, 6) . '-' . time();

        // Build line items
        $items = [];
        $order->loadMissing('items.product');

        foreach ($order->items as $item) {
            $productName = $item->product ? $item->product->name : 'Item';
            $unit = $item->unit ?? 'satuan';
            $qty = (float) $item->quantity;
            $items[] = [
                'id' => substr($item->product?->code ?? 'ITEM-' . $item->id, 0, 50),
                'price' => (int) round((float) $item->subtotal),
                'quantity' => 1,
                'name' => substr("{$productName} ({$qty} {$unit})", 0, 50),
            ];
        }

        if ((float) $order->delivery_fee > 0) {
            $items[] = [
                'id' => 'DELIVERY-FEE',
                'price' => (int) round((float) $order->delivery_fee),
                'quantity' => 1,
                'name' => 'Biaya Pengantaran Armada',
            ];
        }

        if ((float) $order->ppn > 0) {
            $items[] = [
                'id' => 'PPN-11',
                'price' => (int) round((float) $order->ppn),
                'quantity' => 1,
                'name' => 'PPN (11%)',
            ];
        }

        if ((float) $order->admin_fee > 0) {
            $items[] = [
                'id' => 'ADMIN-FEE',
                'price' => (int) round((float) $order->admin_fee),
                'quantity' => 1,
                'name' => 'Biaya Layanan Pembayaran',
            ];
        }

        // Adjust rounding discrepancy if any
        $itemsTotal = array_sum(array_column($items, 'price'));
        $diff = $grossAmount - $itemsTotal;
        if ($diff !== 0 && count($items) > 0) {
            $items[count($items) - 1]['price'] += $diff;
        }

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $order->customer_name ?: 'Pelanggan',
                'email' => $order->customer_email ?: 'customer@tonasa.id',
                'phone' => $order->customer_phone ?: '081234567890',
                'shipping_address' => [
                    'first_name' => $order->customer_name ?: 'Pelanggan',
                    'phone' => $order->customer_phone ?: '081234567890',
                    'address' => $order->delivery_address,
                ],
            ],
            'usage_limit' => 5,
        ];

        try {
            $httpClient = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
            ]);

            if (! $this->isProduction) {
                $httpClient = $httpClient->withoutVerifying();
            }

            $response = $httpClient->post("{$this->snapBaseUrl}/transactions", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['token'] ?? '';
                $redirectUrl = $data['redirect_url'] ?? '';

                $currentPayload = is_array($order->payment_payload) ? $order->payment_payload : [];
                $order->update([
                    'snap_token' => $token,
                    'snap_redirect_url' => $redirectUrl,
                    'payment_payload' => array_merge($currentPayload, [
                        'midtrans_order_id' => $orderId,
                    ]),
                ]);

                return [
                    'token' => $token,
                    'redirect_url' => $redirectUrl,
                    'client_key' => $this->clientKey,
                ];
            }

            Log::error('Midtrans Snap API Error: ' . $response->body(), [
                'order_id' => $order->id,
                'status' => $response->status(),
                'payload' => $payload,
            ]);

            // Fallback for offline / demo mode
            $mockToken = 'SNAP-MOCK-' . $order->code . '-' . substr(md5(uniqid()), 0, 8);
            $mockRedirect = "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$mockToken}";

            $currentPayload = is_array($order->payment_payload) ? $order->payment_payload : [];
            $order->update([
                'snap_token' => $mockToken,
                'snap_redirect_url' => $mockRedirect,
                'payment_payload' => array_merge($currentPayload, [
                    'midtrans_order_id' => $mockToken,
                ]),
            ]);

            return [
                'token' => $mockToken,
                'redirect_url' => $mockRedirect,
                'client_key' => $this->clientKey,
            ];
        } catch (\Throwable $e) {
            Log::error('Midtrans Exception: ' . $e->getMessage(), [
                'order_id' => $order->id,
            ]);

            $mockToken = 'SNAP-MOCK-' . $order->code . '-' . substr(md5(uniqid()), 0, 8);
            $mockRedirect = "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$mockToken}";

            $currentPayload = is_array($order->payment_payload) ? $order->payment_payload : [];
            $order->update([
                'snap_token' => $mockToken,
                'snap_redirect_url' => $mockRedirect,
                'payment_payload' => array_merge($currentPayload, [
                    'midtrans_order_id' => $mockToken,
                ]),
            ]);

            return [
                'token' => $mockToken,
                'redirect_url' => $mockRedirect,
                'client_key' => $this->clientKey,
            ];
        }
    }

    /**
     * Check real-time payment status from Midtrans API and sync order.
     */
    public function checkPaymentStatus(Order $order): Order
    {
        if ($order->payment_method !== 'MIDTRANS' || $order->payment_status === 'PAID') {
            return $order;
        }

        $orderId = $order->payment_payload['midtrans_order_id'] ?? null;
        $orderIdCandidates = [];

        if ($orderId) {
            $orderIdCandidates[] = $orderId;
        }

        // Add standard candidate patterns
        $uuidPart = substr(str_replace('-', '', $order->uuid), 0, 6);
        $base = "{$order->code}-{$uuidPart}";
        $createdAtTs = $order->created_at?->timestamp;

        if ($createdAtTs) {
            $orderIdCandidates[] = "{$base}-{$createdAtTs}";
            for ($offset = 1; $offset <= 5; $offset++) {
                $orderIdCandidates[] = "{$base}-" . ($createdAtTs + $offset);
                $orderIdCandidates[] = "{$base}-" . ($createdAtTs - $offset);
            }
        }
        $orderIdCandidates[] = $order->code;

        $httpClient = Http::withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
        ]);

        if (! $this->isProduction) {
            $httpClient = $httpClient->withoutVerifying();
        }

        $baseUrl = $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';

        foreach (array_unique($orderIdCandidates) as $candidateId) {
            try {
                $response = $httpClient->get("{$baseUrl}/{$candidateId}/status");
                if ($response->successful()) {
                    $data = $response->json();
                    if (($data['status_code'] ?? '') !== '404' && isset($data['transaction_status'])) {
                        return $this->applyTransactionStatus($order, $data);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Gagal cek status Midtrans untuk {$candidateId}: " . $e->getMessage());
            }
        }

        return $order;
    }

    /**
     * Apply parsed transaction payload to order.
     *
     * @param  array<string, mixed>  $payload
     */
    public function applyTransactionStatus(Order $order, array $payload): Order
    {
        $transactionStatus = (string) ($payload['transaction_status'] ?? '');
        $fraudStatus = (string) ($payload['fraud_status'] ?? '');
        $paymentType = (string) ($payload['payment_type'] ?? '');
        $transactionId = (string) ($payload['transaction_id'] ?? '');
        $settlementTime = $payload['settlement_time'] ?? null;

        $newPaymentStatus = $order->payment_status;
        $paidAt = $order->paid_at;

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'challenge') {
                $newPaymentStatus = 'CHALLENGE';
            } elseif ($fraudStatus === 'accept') {
                $newPaymentStatus = 'PAID';
                $paidAt = $paidAt ?: ($settlementTime ? \Carbon\Carbon::parse($settlementTime) : now());
            }
        } elseif ($transactionStatus === 'settlement') {
            $newPaymentStatus = 'PAID';
            $paidAt = $paidAt ?: ($settlementTime ? \Carbon\Carbon::parse($settlementTime) : now());
        } elseif ($transactionStatus === 'pending') {
            $newPaymentStatus = 'PENDING';
        } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
            $newPaymentStatus = 'FAILED';
        } elseif (in_array($transactionStatus, ['refund', 'partial_refund'])) {
            $newPaymentStatus = 'REFUNDED';
        }

        $currentPayload = is_array($order->payment_payload) ? $order->payment_payload : [];
        $mergedPayload = array_merge($currentPayload, $payload, [
            'midtrans_order_id' => $payload['order_id'] ?? ($currentPayload['midtrans_order_id'] ?? null),
        ]);

        $order->update([
            'payment_status' => $newPaymentStatus,
            'midtrans_transaction_id' => $transactionId ?: $order->midtrans_transaction_id,
            'midtrans_payment_type' => $paymentType ?: $order->midtrans_payment_type,
            'payment_payload' => $mergedPayload,
            'paid_at' => $paidAt,
        ]);

        return $order;
    }

    /**
     * Process incoming Webhook notification from Midtrans.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleNotification(array $payload): Order
    {
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');

        // Verify SHA512 signature
        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);
        $signatureValid = hash_equals($expectedSignature, $signatureKey);

        /** @var Order|null $order */
        $order = Order::query()
            ->where('code', $orderId)
            ->orWhere('payment_payload->midtrans_order_id', $orderId)
            ->first();

        if (! $order && preg_match('/^(SO-[A-Za-z0-9]+-\d+)/', $orderId, $matches)) {
            $order = Order::query()->where('code', $matches[1])->first();
        }

        if (! $order) {
            // Strip -{uuid_6}-{timestamp} suffix if present
            $trimmedCode = preg_replace('/-[a-f0-9]{6}-\d+$/', '', $orderId);
            $order = Order::query()->where('code', $trimmedCode)->first();
        }

        if (! $order) {
            $lastHyphenPos = strrpos($orderId, '-');
            if ($lastHyphenPos !== false) {
                $order = Order::query()->where('code', substr($orderId, 0, $lastHyphenPos))->first();
            }
        }

        if (! $order) {
            throw new Exception("Pesanan tidak ditemukan untuk order_id: {$orderId}");
        }

        if (! $signatureValid && ! empty($this->serverKey) && $this->serverKey !== 'SB-Mid-server-test') {
            Log::warning("Midtrans Invalid Signature for order: {$order->code}", [
                'payload' => $payload,
                'expected' => $expectedSignature,
            ]);
            throw new Exception("Signature key Midtrans tidak valid.");
        }

        return $this->applyTransactionStatus($order, $payload);
    }
}
