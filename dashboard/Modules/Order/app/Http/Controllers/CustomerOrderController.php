<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\Dispatch\Models\SuratJalan;
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

    public function index(Request $request, MidtransPaymentService $midtrans): JsonResponse
    {
        $orders = Order::query()
            ->where('customer_id', $this->customer($request)->id)
            ->with([
                'batchingPlant:id,code,name,phone,whatsapp',
                'items.product:id,uuid,code,name,unit,category',
                'workOrders.product',
                'workOrders.assignedUser',
                'suratJalanItems.suratJalan.batchingPlant',
                'suratJalanItems.product',
            ])
            ->orderByDesc('id')
            ->paginate(20);

        foreach ($orders->getCollection() as $orderItem) {
            if ($orderItem->payment_method === 'MIDTRANS' && $orderItem->payment_status === 'PENDING') {
                $midtrans->checkPaymentStatus($orderItem);
            }
        }

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
            'batchingPlant:id,code,name,phone,whatsapp',
            'items.product:id,uuid,code,name,unit,category',
            'workOrders.product',
            'workOrders.assignedUser',
            'suratJalanItems.suratJalan.batchingPlant',
            'suratJalanItems.product',
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
            'batchingPlant:id,code,name,phone,whatsapp',
            'items.product:id,uuid,code,name,unit,category',
            'workOrders.product',
            'workOrders.assignedUser',
            'suratJalanItems.suratJalan.batchingPlant',
            'suratJalanItems.product',
        ]);

        return response()->json([
            'data' => $this->transform($order),
        ]);
    }

    public function pay(Request $request, Order $order, MidtransPaymentService $midtrans): JsonResponse
    {
        $this->owned($request, $order);

        if ($order->status === 'PENDING_APPROVAL') {
            throw ValidationException::withMessages([
                'order' => 'Pesanan masih dalam proses verifikasi tempat oleh tim sales batching plant. Pembayaran dapat dilakukan setelah disetujui (ACC).',
            ]);
        }

        if ($order->status === 'CANCELLED') {
            throw ValidationException::withMessages([
                'order' => 'Pesanan sudah dibatalkan dan tidak dapat dibayar.',
            ]);
        }

        if ($order->payment_status === 'PAID') {
            throw ValidationException::withMessages([
                'order' => 'Pesanan ini sudah lunas.',
            ]);
        }

        $order->load([
            'batchingPlant:id,code,name,phone,whatsapp',
            'items.product:id,uuid,code,name,unit,category',
            'workOrders.product',
            'workOrders.assignedUser',
            'suratJalanItems.suratJalan.batchingPlant',
            'suratJalanItems.product',
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

    /**
     * Pelanggan tidak bisa membatalkan pesanan sendiri; pembatalan & refund oleh admin.
     * Route tetap ada agar aplikasi versi lama mendapat pesan yang jelas.
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->owned($request, $order);

        throw ValidationException::withMessages([
            'status' => ['Pembatalan pesanan hanya dapat dilakukan oleh admin PKM. Silakan hubungi admin / batching plant.'],
        ]);
    }

    public function confirmComplete(Request $request, Order $order): JsonResponse
    {
        $this->owned($request, $order);

        if ($order->status === 'COMPLETED') {
            return response()->json([
                'message' => 'Pesanan ini sudah berstatus selesai.',
                'data' => $this->transform($order),
            ]);
        }

        if ($order->status !== 'ON_DELIVERY') {
            throw ValidationException::withMessages([
                'status' => ['Pesanan belum dalam status pengantaran.'],
            ]);
        }

        $order->load('items');
        $allFulfilled = $order->items->every(fn ($i) => (float) $i->fulfilled_quantity >= (float) $i->quantity);
        $hasActiveSj = $order->suratJalanItems()
            ->whereHas('suratJalan', fn ($q) => $q->whereIn('status', SuratJalan::ACTIVE_STATUSES))
            ->exists();
        if (! $allFulfilled || $hasActiveSj) {
            throw ValidationException::withMessages([
                'status' => ['Pengantaran seluruh ritase pesanan belum tuntas 100%.'],
            ]);
        }

        $order->update([
            'status' => 'COMPLETED',
            'customer_confirmed_at' => now(),
            'completed_by' => 'CUSTOMER',
        ]);

        $order->load([
            'batchingPlant:id,code,name,phone,whatsapp',
            'items.product:id,uuid,code,name,unit,category',
            'workOrders.product',
            'workOrders.assignedUser',
            'suratJalanItems.suratJalan.batchingPlant',
            'suratJalanItems.product',
        ]);

        return response()->json([
            'message' => 'Pesanan berhasil dikonfirmasi selesai.',
            'data' => $this->transform($order),
        ]);
    }

    public function downloadDocument(Request $request, Order $order, string $type): Response
    {
        $this->owned($request, $order);

        $type = strtolower($type);

        if ($type === 'spk') {
            $workOrder = $order->workOrders()->with(['product', 'assignedUser', 'batchingPlant'])->first();
            if (! $workOrder) {
                abort(404, 'Dokumen SPK belum diterbitkan oleh bagian produksi batching plant.');
            }
            $pdf = Pdf::loadView('order::pdf.spk', compact('order', 'workOrder'));

            return $pdf->download("SPK-{$workOrder->code}.pdf");
        }

        if ($type === 'surat-jalan' || $type === 'suratjalan') {
            $suratJalanItem = $order->suratJalanItems()->with(['suratJalan.batchingPlant', 'suratJalan.driver', 'product', 'workOrder.assignedUser'])->first();
            if (! $suratJalanItem || ! $suratJalanItem->suratJalan) {
                abort(404, 'Dokumen Surat Jalan belum diterbitkan oleh bagian logistik.');
            }
            $suratJalan = $suratJalanItem->suratJalan;
            $order->load(['customer', 'batchingPlant']);
            $pdf = Pdf::loadView('order::pdf.surat-jalan', compact('order', 'suratJalan', 'suratJalanItem'));

            return $pdf->download("SuratJalan-{$suratJalan->code}.pdf");
        }

        if ($type === 'faktur' || $type === 'efaktur') {
            $order->load(['items.product', 'batchingPlant']);
            $pdf = Pdf::loadView('order::pdf.faktur', compact('order'));

            return $pdf->download("Faktur-{$order->code}.pdf");
        }

        abort(400, 'Tipe dokumen tidak valid.');
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
        $workOrders = $order->relationLoaded('workOrders') ? $order->workOrders : collect();
        $suratJalans = $order->relationLoaded('suratJalanItems')
            ? $order->suratJalanItems->map(fn ($sji) => $sji->suratJalan)->filter()->unique('id')->values()
            : collect();

        $hasSpk = $workOrders->isNotEmpty();
        $hasSuratJalan = $suratJalans->isNotEmpty();
        $hasFaktur = in_array($order->payment_status, ['PAID'], true) || in_array($order->status, ['CONFIRMED', 'PROCESSING', 'ON_DELIVERY', 'COMPLETED'], true);
        // Selaras dengan guard endpoint pay(): tagihan aktif setelah ACC sampai lunas.
        $canPay = ! in_array($order->status, ['PENDING_APPROVAL', 'CANCELLED'], true)
            && in_array($order->payment_status, ['PENDING', 'FAILED'], true);
        $canCancel = false;
        $items = $order->relationLoaded('items') ? $order->items : collect();
        $allFulfilled = $items->isNotEmpty() && $items->every(fn ($i) => (float) $i->fulfilled_quantity >= (float) $i->quantity);
        $hasActiveSj = $suratJalans->contains(fn ($sj) => in_array($sj->status, SuratJalan::ACTIVE_STATUSES, true));
        $canConfirmComplete = $order->status === 'ON_DELIVERY' && $allFulfilled && ! $hasActiveSj;
        $autoCompleteAt = $order->delivered_at ? $order->delivered_at->copy()->addHours(48)->toIso8601String() : null;

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
            'refund_amount' => $order->refund_amount !== null ? (float) $order->refund_amount : null,
            'refunded_at' => $order->refunded_at?->toIso8601String(),
            'cancellation_reason' => $order->cancellation_reason ?? $order->rejection_reason,
            'snap_token' => $order->snap_token,
            'snap_redirect_url' => $order->snap_redirect_url,
            'midtrans_client_key' => (string) config('services.midtrans.client_key', ''),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'status' => $order->status,
            'status_label' => $this->statusLabel($order->status),
            'approved_at' => $order->approved_at?->toIso8601String(),
            'survey_notes' => $order->survey_notes,
            'delivered_at' => $order->delivered_at?->toIso8601String(),
            'customer_confirmed_at' => $order->customer_confirmed_at?->toIso8601String(),
            'completed_by' => $order->completed_by,
            'can_pay' => $canPay,
            'can_cancel' => $canCancel,
            'can_confirm_complete' => $canConfirmComplete,
            'auto_complete_at' => $autoCompleteAt,
            'has_spk' => $hasSpk,
            'has_surat_jalan' => $hasSuratJalan,
            'has_faktur' => $hasFaktur,
            'notes' => $order->notes,
            'plant' => $order->batchingPlant ? [
                'code' => $order->batchingPlant->code,
                'name' => $order->batchingPlant->name,
                'phone' => $order->batchingPlant->phone,
                'whatsapp' => $order->batchingPlant->whatsapp,
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
            'work_orders' => $workOrders->map(fn ($wo) => [
                'uuid' => $wo->uuid,
                'code' => $wo->code,
                'status' => $wo->status,
                'product_name' => $wo->product?->name,
                'product_code' => $wo->product?->code,
                'target_quantity' => (float) $wo->target_quantity,
                'produced_quantity' => (float) $wo->produced_quantity,
                'dispatched_quantity' => (float) $wo->dispatched_quantity,
                'unit' => $wo->unit,
                'batch_recipe_code' => $wo->batch_recipe_code,
                'slump_target' => $wo->slump_target,
                'scheduled_date' => $wo->scheduled_date ? $wo->scheduled_date->format('Y-m-d') : null,
                'scheduled_time_slot' => $wo->scheduled_time_slot,
                'assigned_user_name' => $wo->assignedUser?->name,
                'created_at' => $wo->created_at?->toIso8601String(),
            ])->values(),
            'surat_jalans' => $suratJalans->map(fn ($sj) => [
                'uuid' => $sj->uuid,
                'code' => $sj->code,
                'status' => $sj->status,
                'vehicle_number' => $sj->vehicle_number,
                'vehicle_type' => $sj->vehicle_type,
                'driver_name' => $sj->driver_name,
                'driver_phone' => $sj->driver_phone,
                'departure_time' => $sj->departure_time?->toIso8601String(),
                'arrival_time' => $sj->arrival_time?->toIso8601String(),
                'created_at' => $sj->created_at?->toIso8601String(),
                'items' => $sj->items->where('order_id', $order->id)->map(fn ($item) => [
                    'product_name' => $item->product?->name,
                    'product_code' => $item->product?->code,
                    'slump' => $item->product?->slump ?? $item->workOrder?->slump_target ?? '12 ± 2 cm',
                    'quantity' => (float) $item->quantity_delivered,
                    'unit' => $item->unit,
                    'recipient_name' => $item->recipient_name,
                    'received_at' => $item->received_at?->toIso8601String(),
                    'batch_plant_operator' => $item->workOrder?->assignedUser?->name ?? 'Nurdin',
                    'batch_recipe_code' => $item->workOrder?->batch_recipe_code,
                ])->values(),
            ])->values(),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'PENDING_APPROVAL' => 'Verifikasi Tempat',
            'CONFIRMED' => 'Dikonfirmasi',
            'PROCESSING', 'WORK_ORDER_CREATED', 'IN_PRODUCTION' => 'Diproses',
            'ON_DELIVERY', 'PARTIAL_DELIVERY' => 'Dalam Pengiriman',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '',
        };
    }

    private function paymentLabel(?string $method): string
    {
        return match ($method) {
            'MIDTRANS' => 'Midtrans',
            'VA_MANDIRI' => 'Virtual Account Mandiri',
            'VA_BRI' => 'Virtual Account BRI',
            'CASH' => 'Tunai / Transfer Manual',
            'TRANSFER' => 'Transfer Bank Manual',
            default => $method ?? '',
        };
    }
}
