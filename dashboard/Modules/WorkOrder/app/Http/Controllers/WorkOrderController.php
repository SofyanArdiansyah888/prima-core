<?php

namespace Modules\WorkOrder\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\Shared\Concerns\AuthorizesPlantAccess;
use Modules\Shared\Services\CodeGenerator;
use Modules\WorkOrder\Http\Requests\StoreWorkOrderRequest;
use Modules\WorkOrder\Models\WorkOrder;

class WorkOrderController extends Controller
{
    use AuthorizesPlantAccess;

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $plantId = $request->input('batching_plant_id');

        $user = $request->user();
        $filtered = fn () => WorkOrder::query()
            ->visibleTo($user)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('code', 'like', "%{$search}%")
                        ->orWhereHas('order', function ($sub) use ($search) {
                            $sub->where('customer_name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%")
                                ->orWhere('project_title', 'like', "%{$search}%");
                        });
                });
            })
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId));

        $workOrders = $filtered()
            ->with([
                'order:id,uuid,code,customer_name,project_title,delivery_address',
                'product:id,uuid,code,name,unit,category',
                'batchingPlant:id,uuid,code,name',
                'assignedUser:id,name,code',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->orderByDesc('scheduled_date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/work-order/index', [
            'workOrders' => $workOrders,
            'counts' => $filtered()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'plants' => BatchingPlant::query()->visibleTo($user)->where('is_active', true)->orderBy('name')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => [
                ['value' => 'SCHEDULED', 'label' => 'Terjadwal'],
                ['value' => 'IN_PRODUCTION', 'label' => 'Sedang Produksi / Batching'],
                ['value' => 'READY_FOR_DISPATCH', 'label' => 'Siap Kirim'],
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

    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $orderId = $request->input('order_id');
        $selectedOrder = null;

        if ($orderId) {
            $selectedOrder = Order::with(['items.product', 'batchingPlant'])->find($orderId);
            $this->ensurePlantAccess($selectedOrder?->batching_plant_id);

            if ($reason = Order::productionBlockReason($selectedOrder)) {
                return back()->with('error', $reason);
            }

            if ($selectedOrder->workOrders()->where('status', '!=', 'CANCELLED')->exists()) {
                return redirect()->route('work-orders.index')
                    ->with('error', "Pesanan {$selectedOrder->code} sudah memiliki SPK.");
            }
        }

        return Inertia::render('modules/work-order/form', [
            'selectedOrder' => $selectedOrder,
            // Hanya pesanan LUNAS yang belum punya SPK aktif
            'orders' => Order::query()
                ->visibleTo($user)
                ->readyForProduction()
                ->whereDoesntHave('workOrders', fn ($q) => $q->where('status', '!=', 'CANCELLED'))
                ->with(['items.product', 'batchingPlant'])
                ->orderByDesc('id')
                ->get(),
            'plants' => BatchingPlant::query()->visibleTo($user)->where('is_active', true)->orderBy('name')->get(['id', 'uuid', 'code', 'name']),
            // Operator: hanya user yang bertugas di plant yang sama (kecuali akses penuh)
            'users' => User::query()
                ->where('is_active', true)
                ->when($user->accessiblePlantIds() !== null, fn ($q) => $q->whereHas(
                    'batchingPlants',
                    fn ($p) => $p->whereIn('batching_plants.id', $user->accessiblePlantIds() ?: [0])
                ))
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'role']),
        ]);
    }

    public function store(StoreWorkOrderRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $plant = BatchingPlant::findOrFail($data['batching_plant_id']);
        $product = Product::findOrFail($data['product_id']);
        $code = $codes->nextWorkOrderCode($plant->code);

        $workOrder = WorkOrder::create([
            ...$data,
            'code' => $code,
            'unit' => $product->unit,
            'produced_quantity' => 0,
            'dispatched_quantity' => 0,
            'status' => 'SCHEDULED',
        ]);

        // Update order status
        $order = Order::find($data['order_id']);
        if ($order && in_array($order->status, ['CONFIRMED', 'DRAFT'])) {
            $order->update(['status' => 'PROCESSING']);
        }

        return redirect()->route('work-orders.index')->with('success', "Work Order {$code} berhasil diterbitkan.");
    }

    public function show(WorkOrder $workOrder): Response
    {
        $this->ensurePlantAccess($workOrder->batching_plant_id);

        $workOrder->load([
            'order.items.product',
            'product',
            'batchingPlant.branch',
            'assignedUser',
        ]);

        return Inertia::render('modules/work-order/show', [
            'workOrder' => $workOrder,
        ]);
    }

    public function destroy(WorkOrder $workOrder): RedirectResponse
    {
        $this->ensurePlantAccess($workOrder->batching_plant_id);

        if ((float) $workOrder->dispatched_quantity > 0) {
            return back()->with('error', 'SPK tidak dapat dihapus karena sudah memiliki ritase pengiriman Surat Jalan.');
        }

        $orderId = $workOrder->order_id;
        $workOrder->delete();

        if ($orderId) {
            $order = Order::find($orderId);
            if ($order && $order->status === 'PROCESSING' && $order->workOrders()->count() === 0) {
                $order->update(['status' => 'CONFIRMED']);
            }
        }

        return redirect()->route('work-orders.index')->with('success', 'Work Order berhasil dihapus.');
    }
}
