<?php

namespace Modules\Order\Services;

use Illuminate\Support\Facades\DB;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Services\CodeGenerator;

class PlaceOrder
{
    public function __construct(private CodeGenerator $codes) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function place(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $plant = BatchingPlant::query()->with('branch')->findOrFail($data['batching_plant_id']);
            $region = $plant->branch ? $this->codes->regionFromBranchCode($plant->branch->code) : 'HQ';
            $orderCode = $this->codes->nextOrderCode($region);

            $priced = [];
            $lineAmounts = [];

            foreach ($data['items'] as $item) {
                $product = Product::query()->findOrFail($item['product_id']);
                $lineAmounts[] = (float) $product->base_price * (float) $item['quantity'];
                $priced[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ];
            }

            $totals = OrderTotals::fromLineAmounts($lineAmounts, (float) $data['delivery_fee']);

            $order = Order::query()->create([
                'code' => $orderCode,
                'customer_id' => $data['customer_id'] ?? null,
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
                'delivery_fee' => $totals['delivery_fee'],
                'subtotal' => $totals['subtotal'],
                'ppn' => $totals['ppn'],
                'total_price' => $totals['total_price'],
                'payment_method' => $data['payment_method'],
                'payment_status' => $data['payment_status'],
                'status' => 'CONFIRMED',
                'po_number' => $data['po_number'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($priced as $index => $row) {
                /** @var Product $product */
                $product = $row['product'];

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $row['quantity'],
                    'fulfilled_quantity' => 0,
                    'unit' => $product->unit,
                    'unit_price' => $product->base_price,
                    'subtotal' => $totals['lines'][$index],
                    'notes' => $row['notes'],
                ]);
            }

            return $order->load([
                'batchingPlant:id,code,name',
                'items.product:id,uuid,code,name,unit,category',
            ]);
        });
    }
}
