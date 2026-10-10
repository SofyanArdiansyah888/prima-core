<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\Order\Http\Requests\QuoteDeliveryRequest;
use Modules\Order\Http\Requests\StoreCustomerOrderRequest;
use Modules\Order\Models\Order;
use Modules\Order\Services\CustomerOrderService;
use Modules\Order\Services\MidtransPaymentService;

class CustomerOrderController extends Controller
{
    public function quote(QuoteDeliveryRequest $request, CustomerOrderService $orders): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'data' => $orders->quote((float) $data['delivery_lat'], (float) $data['delivery_lng'], $data['items']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('customer_id', $this->customer($request)->id)
            ->with([
                'batchingPlant:id,code,name',
                'items.product:id,uuid,code,name,unit,category',
            ])
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'data' => $orders->getCollection()->map(fn (Order $order) => $this->transform($order))->values(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function store(StoreCustomerOrderRequest $request, CustomerOrderService $orders): JsonResponse
    {
        $order = $orders->place($this->customer($request), $request->validated());

        return response()->json([
            'data' => $this->transform($order),
        ], 201);
    }

    public function show(Request $request, Order $order, MidtransPaymentService $midtrans): JsonResponse
    {
        $this->owned($request, $order);

        if ($order->payment_method === 'MIDTRANS' && $order->payment_status === 'PENDING') {
            $order = $midtrans->checkPaymentStatus($order);
        }

        $order->load([
            'batchingPlant:id,code,name',
            'items.product:id,uuid,code,name,unit,category',
        ]);

        return response()->json([
            'data' => $this->transform($order),
        ]);
    }

    public function syncPayment(Request $request, Order $order, MidtransPaymentService $midtrans): JsonResponse
    {
        $this->owned($request, $order);

        $order = $midtrans->checkPaymentStatus($order);
        $order->load([
            'batchingPlant:id,code,name',
            'items.product:id,uuid,code,name,unit,category',
        ]);

        return response()->json([
            'data' => $this->transform($order),
        ]);
    }

    public function pay(Request $request, Order $order, MidtransPaymentService $midtrans): JsonResponse
    {
        $this->owned($request, $order);

        $order->load([
            'batchingPlant:id,code,name',
            'items.product:id,uuid,code,name,unit,category',
        ]);

        $forceRefresh = $request->boolean('refresh', false);
        $result = $midtrans->createSnapTransaction($order, $forceRefresh);

        return response()->json([
            'data' => array_merge($this->transform($order), [
                'snap_token' => $result['token'],
                'snap_redirect_url' => $result['redirect_url'],
                'midtrans_client_key' => $result['client_key'],
            ]),
        ]);
    }

    public function webhook(Request $request, MidtransPaymentService $midtrans): JsonResponse
    {
        try {
            $order = $midtrans->handleNotification($request->all());

            return response()->json([
                'status' => 'OK',
                'order' => $order->code,
                'payment_status' => $order->payment_status,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->owned($request, $order);

        if ($order->status !== 'CONFIRMED') {
            throw ValidationException::withMessages([
                'status' => 'Pesanan tidak dapat dibatalkan.',
            ]);
        }

        $order->update(['status' => 'CANCELLED']);
        $order->load([
            'batchingPlant:id,code,name',
            'items.product:id,uuid,code,name,unit,category',
        ]);

        return response()->json([
            'data' => $this->transform($order),
        ]);
    }

    private function customer(Request $request): Customer
    {
        /** @var Customer $customer */
        $customer = $request->user();

        return $customer;
    }

    private function owned(Request $request, Order $order): void
    {
        if ($order->customer_id !== $this->customer($request)->id) {
            abort(404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(Order $order): array
    {
        return [
            'uuid' => $order->uuid,
            'code' => $order->code,
            'project_title' => $order->project_title,
            'delivery_address' => $order->delivery_address,
            'delivery_lat' => $order->delivery_lat !== null ? (float) $order->delivery_lat : null,
            'delivery_lng' => $order->delivery_lng !== null ? (float) $order->delivery_lng : null,
            'distance_km' => (float) $order->distance_km,
            'delivery_fee' => (float) $order->delivery_fee,
            'admin_fee' => (float) $order->admin_fee,
            'subtotal' => (float) $order->subtotal,
            'ppn' => (float) $order->ppn,
            'total_price' => (float) $order->total_price,
            'payment_method' => $order->payment_method,
            'payment_method_label' => $this->paymentLabel($order->payment_method),
            'payment_status' => $order->payment_status,
            'snap_token' => $order->snap_token,
            'snap_redirect_url' => $order->snap_redirect_url,
            'midtrans_client_key' => (string) config('services.midtrans.client_key', ''),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'status' => $order->status,
            'status_label' => $this->statusLabel($order->status),
            'can_cancel' => $order->status === 'CONFIRMED',
            'notes' => $order->notes,
            'plant' => $order->batchingPlant ? [
                'code' => $order->batchingPlant->code,
                'name' => $order->batchingPlant->name,
            ] : null,
            'items' => $order->items->map(fn ($item) => [
                'code' => $item->product?->code,
                'name' => $item->product?->name,
                'category' => $item->product?->category,
                'quantity' => (float) $item->quantity,
                'fulfilled_quantity' => (float) $item->fulfilled_quantity,
                'unit' => $item->unit,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
                'notes' => $item->notes,
            ])->values(),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'DRAFT' => 'Draf',
            'CONFIRMED' => 'Dikonfirmasi',
            'WORK_ORDER_CREATED' => 'SPK Terbit',
            'IN_PRODUCTION' => 'Dalam Produksi',
            'PARTIAL_DELIVERY' => 'Sebagian Terkirim',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '',
        };
    }

    private function paymentLabel(?string $method): string
    {
        return match ($method) {
            'MIDTRANS' => 'Midtrans Online (QRIS, VA Bank, E-Wallet, Kartu)',
            'VA_MANDIRI' => 'Virtual Account Mandiri',
            'VA_BRI' => 'Virtual Account BRI',
            'CASH' => 'Tunai / Transfer Manual',
            'TRANSFER' => 'Transfer Bank Manual',
            default => $method ?? '',
        };
    }
}
