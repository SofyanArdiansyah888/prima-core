<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\DeliveryRate\Services\PlantDistanceService;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Models\Order;
use Modules\Order\Services\MidtransPaymentService;
use Modules\Order\Services\OrderTotals;

class OrderController extends Controller
{
    public function index(Request $request, MidtransPaymentService $midtrans): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $plantId = $request->input('batching_plant_id');

        $orders = Order::query()
            ->with([
                'batchingPlant:id,uuid,code,name,branch_id',
                'batchingPlant.branch:id,code,name',
                'items.product:id,uuid,code,name,unit,category',
            ])
            ->withCount(['items', 'workOrders'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('code', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('project_title', 'like', "%{$search}%")
                        ->orWhere('po_number', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        foreach ($orders->getCollection() as $orderItem) {
            if ($orderItem->payment_method === 'MIDTRANS' && $orderItem->payment_status === 'PENDING') {
                $midtrans->checkPaymentStatus($orderItem);
            }
        }

        return Inertia::render('modules/order/index', [
            'orders' => $orders,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => [
                ['value' => 'PENDING_APPROVAL', 'label' => 'Menunggu Verifikasi Tempat'],
                ['value' => 'CONFIRMED', 'label' => 'Dikonfirmasi / Siap Bayar'],
                ['value' => 'PROCESSING', 'label' => 'Diproses'],
                ['value' => 'ON_DELIVERY', 'label' => 'Dalam Pengiriman'],
                ['value' => 'COMPLETED', 'label' => 'Selesai'],
                ['value' => 'CANCELLED', 'label' => 'Dibatalkan'],
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'batching_plant_id' => $plantId,
            ],
        ]);
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('orders.index')
            ->with('info', 'Pembuatan pesanan baru saat ini hanya dapat dilakukan melalui aplikasi mobile pelanggan.');
    }

    public function store(Request $request): RedirectResponse
    {
        return redirect()->route('orders.index')
            ->with('error', 'Pembuatan pesanan langsung dari dashboard saat ini dinonaktifkan.');
    }

    public function show(Order $order, MidtransPaymentService $midtrans): Response
    {
        if ($order->payment_method === 'MIDTRANS' && $order->payment_status === 'PENDING') {
            $order = $midtrans->checkPaymentStatus($order);
        }

        $order->load([
            'batchingPlant.branch',
            'approver:id,name,code',
            'items.product',
            'workOrders.assignedUser',
            'suratJalanItems.suratJalan',
            'suratJalanItems.product',
        ]);

        return Inertia::render('modules/order/show', [
            'order' => $order,
        ]);
    }

    public function approve(Request $request, Order $order, PlantDistanceService $distanceService): RedirectResponse
    {
        if ($order->status !== 'PENDING_APPROVAL') {
            return back()->with('error', 'Hanya pesanan berstatus Menunggu Verifikasi Tempat yang dapat disetujui.');
        }

        $validated = $request->validate([
            'delivery_lat' => ['nullable', 'numeric'],
            'delivery_lng' => ['nullable', 'numeric'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'survey_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $updates = [
            'status' => 'CONFIRMED',
            'approved_at' => now(),
            'approved_by_id' => auth()->id(),
            'survey_notes' => $validated['survey_notes'] ?? $order->survey_notes,
        ];

        if (!empty($validated['delivery_address'])) {
            $updates['delivery_address'] = $validated['delivery_address'];
        }

        // If coordinates were adjusted by sales/approver for big truck accessibility
        if (
            isset($validated['delivery_lat'], $validated['delivery_lng']) &&
            ($validated['delivery_lat'] != $order->delivery_lat || $validated['delivery_lng'] != $order->delivery_lng)
        ) {
            $newLat = (float) $validated['delivery_lat'];
            $newLng = (float) $validated['delivery_lng'];
            $updates['delivery_lat'] = $newLat;
            $updates['delivery_lng'] = $newLng;

            $plant = $order->batchingPlant;
            if ($plant && $plant->lat && $plant->lng) {
                $newDistance = $distanceService->calculateDistanceKm($newLat, $newLng, (float) $plant->lat, (float) $plant->lng);
                $updates['distance_km'] = $newDistance;

                $firstItem = $order->items()->with('product')->first();
                $category = $firstItem?->product?->category ?? 'readymix';
                $totalQty = (float) $order->items()->sum('quantity');

                $feeResult = $distanceService->calculateDeliveryFee($plant->id, $newDistance, $category, $totalQty);
                $newDeliveryFee = (float) $feeResult['delivery_fee'];
                $updates['delivery_fee'] = $newDeliveryFee;

                $adminFee = (float) $order->admin_fee;
                $lineAmounts = $order->items->map(fn ($item) => (float) $item->subtotal)->all();
                $totals = OrderTotals::fromLineAmounts($lineAmounts, $newDeliveryFee, $adminFee);

                $updates['subtotal'] = $totals['subtotal'];
                $updates['ppn'] = $totals['ppn'];
                $updates['total_price'] = $totals['total_price'];
            }
        }

        $order->update($updates);

        return back()->with('success', "Pesanan {$order->code} berhasil diverifikasi dan disetujui (ACC). Titik lokasi akses armada telah diperbarui dan pelanggan kini dapat melakukan pembayaran.");
    }

    public function reject(Request $request, Order $order): RedirectResponse
    {
        if ($order->status !== 'PENDING_APPROVAL') {
            return back()->with('error', 'Hanya pesanan berstatus Menunggu Verifikasi Tempat yang dapat ditolak.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $order->update([
            'status' => 'CANCELLED',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', "Pesanan {$order->code} telah ditolak.");
    }

    public function syncPayment(Order $order, MidtransPaymentService $midtrans): RedirectResponse
    {
        $order = $midtrans->checkPaymentStatus($order);
        $statusLabel = $order->payment_status === 'PAID' ? 'LUNAS (Terverifikasi Midtrans)' : $order->payment_status;

        return back()->with('success', "Status pembayaran pesanan {$order->code}: {$statusLabel}.");
    }

    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        $data = $request->validated();
        $newStatus = $data['status'] ?? $order->status;

        if (in_array($order->status, ['COMPLETED', 'CANCELLED'], true)) {
            return back()->with('error', 'Status pesanan sudah final dan tidak dapat diubah lagi.');
        }

        if ($newStatus === 'COMPLETED') {
            return back()->with('error', 'Status pesanan tidak dapat diselesaikan secara manual. Status akan otomatis Selesai setelah pengantaran Surat Jalan tuntas.');
        }

        if ($newStatus === 'CANCELLED') {
            $hasActiveDeliveries = $order->suratJalanItems()
                ->whereIn('status', ['ON_TRUCK', 'DELIVERED'])
                ->exists();

            if ($hasActiveDeliveries) {
                return back()->with('error', 'Pesanan tidak dapat dibatalkan karena pengiriman sedang berjalan atau telah diserahterimakan.');
            }
        }

        $order->update($data);

        return redirect()->route('orders.show', $order)->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function destroy(Order $order): RedirectResponse
    {
        if (in_array($order->status, ['COMPLETED', 'CANCELLED'], true)) {
            return back()->with('error', 'Pesanan tidak dapat dibatalkan.');
        }

        $hasActiveDeliveries = $order->suratJalanItems()
            ->whereIn('status', ['ON_TRUCK', 'DELIVERED'])
            ->exists();

        if ($hasActiveDeliveries) {
            return back()->with('error', 'Pesanan tidak dapat dibatalkan karena pengiriman sedang berjalan.');
        }

        $order->update(['status' => 'CANCELLED']);

        return redirect()->route('orders.index')->with('success', 'Pesanan dibatalkan.');
    }
}
