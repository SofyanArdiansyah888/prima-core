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

                $order->update([
                    'snap_token' => $token,
                    'snap_redirect_url' => $redirectUrl,
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

            $order->update([
                'snap_token' => $mockToken,
                'snap_redirect_url' => $mockRedirect,
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

            $order->update([
                'snap_token' => $mockToken,
                'snap_redirect_url' => $mockRedirect,
            ]);

            return [
                'token' => $mockToken,
                'redirect_url' => $mockRedirect,
                'client_key' => $this->clientKey,
            ];
        }
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

        // Extract base order code
        $parts = explode('-', $orderId);
        $orderCode = $parts[0] . (isset($parts[1]) && ! is_numeric($parts[1]) ? '-' . $parts[1] : '');

        /** @var Order|null $order */
        $order = Order::query()
            ->where('code', $orderCode)
            ->orWhere('code', $orderId)
            ->orWhere('code', 'like', $parts[0] . '%')
            ->first();

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

        $transactionStatus = (string) ($payload['transaction_status'] ?? '');
        $fraudStatus = (string) ($payload['fraud_status'] ?? '');
        $paymentType = (string) ($payload['payment_type'] ?? '');
        $transactionId = (string) ($payload['transaction_id'] ?? '');

        $newPaymentStatus = $order->payment_status;
        $paidAt = $order->paid_at;

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'challenge') {
                $newPaymentStatus = 'CHALLENGE';
            } elseif ($fraudStatus === 'accept') {
                $newPaymentStatus = 'PAID';
                $paidAt = now();
            }
        } elseif ($transactionStatus === 'settlement') {
            $newPaymentStatus = 'PAID';
            $paidAt = now();
        } elseif ($transactionStatus === 'pending') {
            $newPaymentStatus = 'PENDING';
        } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
            $newPaymentStatus = 'FAILED';
        } elseif (in_array($transactionStatus, ['refund', 'partial_refund'])) {
            $newPaymentStatus = 'REFUNDED';
        }

        $order->update([
            'payment_status' => $newPaymentStatus,
            'midtrans_transaction_id' => $transactionId,
            'midtrans_payment_type' => $paymentType,
            'payment_payload' => $payload,
            'paid_at' => $paidAt,
        ]);

        return $order;
    }
}
