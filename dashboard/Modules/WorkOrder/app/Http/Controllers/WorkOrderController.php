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
use Modules\Shared\Services\CodeGenerator;
use Modules\WorkOrder\Http\Requests\StoreWorkOrderRequest;
use Modules\WorkOrder\Http\Requests\UpdateWorkOrderStatusRequest;
use Modules\WorkOrder\Models\WorkOrder;

class WorkOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $plantId = $request->input('batching_plant_id');

        $workOrders = WorkOrder::query()
            ->with([
                'order:id,uuid,code,customer_name,project_title,delivery_address',
                'product:id,uuid,code,name,unit,category',
                'batchingPlant:id,uuid,code,name',
                'assignedUser:id,name,code',
            ])
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
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId))
            ->orderByDesc('scheduled_date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/work-order/index', [
            'workOrders' => $workOrders,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
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

    public function create(Request $request): Response
    {
        $orderId = $request->input('order_id');
        $selectedOrder = null;

        if ($orderId) {
            $selectedOrder = Order::with(['items.product', 'batchingPlant'])->find($orderId);
        }

        return Inertia::render('modules/work-order/form', [
            'selectedOrder' => $selectedOrder,
            'orders' => Order::query()->whereNotIn('status', ['COMPLETED', 'CANCELLED'])->with(['items.product', 'batchingPlant'])->orderByDesc('id')->get(),
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'users' => User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'role']),
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
            $order->update(['status' => 'WORK_ORDER_CREATED']);
        }

        return redirect()->route('work-orders.index')->with('success', "Work Order {$code} berhasil diterbitkan.");
    }

    public function show(WorkOrder $workOrder): Response
    {
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

    public function updateStatus(UpdateWorkOrderStatusRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $workOrder->update($request->validated());

        return redirect()->route('work-orders.show', $workOrder)->with('success', 'Status Work Order berhasil diperbarui.');
    }

    public function destroy(WorkOrder $workOrder): RedirectResponse
    {
        $workOrder->update(['status' => 'CANCELLED']);

        return redirect()->route('work-orders.index')->with('success', 'Work Order dibatalkan.');
    }
}
