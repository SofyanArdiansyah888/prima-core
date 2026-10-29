<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Models\Order;
use Modules\Order\Services\ApproveOrderSite;
use Modules\Order\Services\CancelOrder;
use Modules\Order\Services\MidtransPaymentService;

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

    public function approve(Request $request, Order $order, ApproveOrderSite $approveSite): RedirectResponse
    {
        if ($order->status !== 'PENDING_APPROVAL') {
            return back()->with('error', 'Hanya pesanan berstatus Menunggu Verifikasi Tempat yang dapat disetujui.');
        }

        $validated = $request->validate([
            'delivery_lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:delivery_lng'],
            'delivery_lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:delivery_lat'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'survey_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $approveSite->approve($order, $request->user(), $validated);

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

    /**
     * Verifikasi pembayaran manual (mis. transfer) dan catatan. Perubahan status
     * pesanan mengikuti alur (ACC, SPK, SJ, konfirmasi pelanggan), bukan form ini.
     */
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Hanya admin yang dapat mengubah data pembayaran pesanan.');

        $data = $request->validated();

        if (in_array($order->status, ['COMPLETED', 'CANCELLED'], true)) {
            return back()->with('error', 'Status pesanan sudah final dan tidak dapat diubah lagi.');
        }

        if (isset($data['status']) && $data['status'] !== $order->status) {
            return back()->with('error', 'Status pesanan tidak dapat diubah manual. Gunakan alur ACC, SPK, Surat Jalan, atau tombol Batalkan & Refund.');
        }

        unset($data['status']);
        if (($data['payment_status'] ?? null) === 'PAID' && ! $order->paid_at) {
            $data['paid_at'] = now();
        }

        $order->update($data);

        return redirect()->route('orders.show', $order)->with('success', 'Data pesanan berhasil diperbarui.');
    }

    public function cancel(Request $request, Order $order, CancelOrder $cancelOrder): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Hanya admin yang dapat membatalkan pesanan.');

        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:1000'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_reference' => ['nullable', 'string', 'max:128'],
        ]);

        $wasPaid = $order->isPaid();
        $cancelOrder->cancel($order, $request->user(), $validated);

        return redirect()->route('orders.show', $order)->with(
            'success',
            $wasPaid
                ? "Pesanan {$order->code} dibatalkan dan refund tercatat. Pastikan dana sudah dikembalikan ke pelanggan."
                : "Pesanan {$order->code} dibatalkan."
        );
    }

    public function destroy(Order $order): RedirectResponse
    {
        return back()->with('error', 'Gunakan tombol Batalkan Pesanan (admin) agar alasan dan refund tercatat.');
    }
}
