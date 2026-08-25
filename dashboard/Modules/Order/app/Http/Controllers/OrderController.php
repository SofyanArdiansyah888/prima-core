<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Order\Http\Requests\StoreOrderRequest;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Services\CodeGenerator;

class OrderController extends Controller
{
    public function index(Request $request): Response
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

        return Inertia::render('modules/order/index', [
            'orders' => $orders,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => [
                ['value' => 'CONFIRMED', 'label' => 'Dikonfirmasi'],
                ['value' => 'WORK_ORDER_CREATED', 'label' => 'SPK Terbit'],
                ['value' => 'IN_PRODUCTION', 'label' => 'Dalam Produksi'],
                ['value' => 'PARTIAL_DELIVERY', 'label' => 'Sebagian Terkirim'],
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

    public function create(): Response
    {
        return Inertia::render('modules/order/form', [
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name', 'lat', 'lng']),
            'products' => Product::query()->where('is_active', true)->orderBy('category')->orderBy('name')->get(),
            'customerTypes' => [
                ['value' => 'B2C', 'label' => 'Pelanggan Umum (B2C)'],
                ['value' => 'B2B_PARTNER', 'label' => 'B2B Partner (Kontraktor)'],
            ],
            'paymentMethods' => [
                ['value' => 'VA_MANDIRI', 'label' => 'Virtual Account Bank Mandiri'],
                ['value' => 'VA_BRI', 'label' => 'Virtual Account Bank BRI'],
                ['value' => 'CREDIT_B2B', 'label' => 'Kredit B2B (TOP 30 Hari PKM)'],
                ['value' => 'CASH', 'label' => 'Tunai / Transfer Langsung'],
            ],
        ]);
    }

    public function store(StoreOrderRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $plant = BatchingPlant::with('branch')->findOrFail($data['batching_plant_id']);
        $region = $plant->branch ? $codes->regionFromBranchCode($plant->branch->code) : 'HQ';
        $orderCode = $codes->nextOrderCode($region);

        DB::transaction(function () use ($data, $orderCode, $plant) {
            $itemsData = $data['items'];
            $subtotal = 0;

            foreach ($itemsData as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subtotal += ((float) $product->base_price * (float) $item['quantity']);
            }

            $deliveryFee = (float) $data['delivery_fee'];
            $ppn = ($subtotal + $deliveryFee) * 0.11;
            $totalPrice = $subtotal + $deliveryFee + $ppn;

            $order = Order::create([
                'code' => $orderCode,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_email' => $data['customer_email'] ?? null,
                'customer_type' => $data['customer_type'],
                'project_title' => $data['project_title'],
                'delivery_address' => $data['delivery_address'],
                'delivery_lat' => $data['delivery_lat'] ?? null,
                'delivery_lng' => $data['delivery_lng'] ?? null,
                'batching_plant_id' => $plant->id,
                'distance_km' => $data['distance_km'] ?? 0,
                'delivery_fee' => $deliveryFee,
                'subtotal' => $subtotal,
                'ppn' => $ppn,
                'total_price' => $totalPrice,
                'payment_method' => $data['payment_method'],
                'payment_status' => $data['payment_status'],
                'status' => 'CONFIRMED',
                'po_number' => $data['po_number'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                $product = Product::findOrFail($item['product_id']);
                $itemSubtotal = (float) $product->base_price * (float) $item['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'fulfilled_quantity' => 0,
                    'unit' => $product->unit,
                    'unit_price' => $product->base_price,
                    'subtotal' => $itemSubtotal,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return redirect()->route('orders.index')->with('success', "Pesanan {$orderCode} berhasil dibuat.");
    }

    public function show(Order $order): Response
    {
        $order->load([
            'batchingPlant.branch',
            'items.product',
            'workOrders.assignedUser',
        ]);

        return Inertia::render('modules/order/show', [
            'order' => $order,
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        $order->update($request->validated());

        return redirect()->route('orders.show', $order)->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->update(['status' => 'CANCELLED']);

        return redirect()->route('orders.index')->with('success', 'Pesanan dibatalkan.');
    }
}
