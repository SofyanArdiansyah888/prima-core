<?php

namespace Modules\Order\Services;

use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\DeliveryRate\Services\PlantDistanceService;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;

class CustomerOrderService
{
    public function __construct(
        private PlantDistanceService $distance,
        private PlaceOrder $placeOrder,
        private MidtransPaymentService $midtrans,
    ) {}

    /**
     * @param  list<array{product_uuid: string, quantity: float|int|string, notes?: ?string}>  $items
     * @return array<string, mixed>
     */
    public function quote(float $lat, float $lng, array $items): array
    {
        $built = $this->build($lat, $lng, $items);

        return [
            'category' => $built['category'],
            'plant' => $built['plant'],
            'distance_km' => $built['distance_km'],
            'delivery_fee' => $built['delivery_fee'],
            'admin_fee' => $built['admin_fee'],
            'subtotal' => $built['subtotal'],
            'ppn' => $built['ppn'],
            'total_price' => $built['total_price'],
            'details' => $built['details'],
            'items' => $built['items'],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function place(Customer $customer, array $input): Order
    {
        $built = $this->build(
            (float) $input['delivery_lat'],
            (float) $input['delivery_lng'],
            $input['items'],
        );

        $order = $this->placeOrder->place([
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'customer_email' => $customer->email,
            'customer_type' => 'B2C',
            'project_title' => $input['project_title'],
            'delivery_address' => $input['delivery_address'],
            'delivery_lat' => $input['delivery_lat'],
            'delivery_lng' => $input['delivery_lng'],
            'batching_plant_id' => $built['plant_id'],
            'distance_km' => $built['distance_km'],
            'delivery_fee' => $built['delivery_fee'],
            'admin_fee' => $built['admin_fee'],
            'payment_method' => $input['payment_method'],
            'payment_status' => 'PENDING',
            'po_number' => null,
            'notes' => $input['notes'] ?? null,
            'items' => $built['lines'],
        ]);

        if ($order->payment_method === 'MIDTRANS') {
            $this->midtrans->createSnapTransaction($order);
        }

        return $order;
    }

    /**
     * @param  list<array{product_uuid: string, quantity: float|int|string, notes?: ?string}>  $items
     * @return array<string, mixed>
     */
    private function build(float $lat, float $lng, array $items): array
    {
        $resolved = $this->resolveItems($items);
        $nearest = $this->distance->findNearestPlant($lat, $lng);
        $plant = $nearest['plant'];

        if ($plant === null) {
            throw ValidationException::withMessages([
                'delivery_lat' => 'Tidak ada batching plant aktif di dekat lokasi ini.',
            ]);
        }

        $fee = $this->distance->calculateDeliveryFee(
            $plant->id,
            $nearest['distance_km'],
            $resolved['category'],
            $resolved['quantity'],
        );

        $adminFee = (float) config('services.midtrans.admin_fee', 4500);
        $totals = OrderTotals::fromLineAmounts($resolved['line_amounts'], (float) $fee['delivery_fee'], $adminFee);

        return [
            'category' => $resolved['category'],
            'plant_id' => $plant->id,
            'plant' => [
                'code' => $plant->code,
                'name' => $plant->name,
            ],
            'distance_km' => (float) $nearest['distance_km'],
            'delivery_fee' => $totals['delivery_fee'],
            'admin_fee' => $totals['admin_fee'],
            'subtotal' => $totals['subtotal'],
            'ppn' => $totals['ppn'],
            'total_price' => $totals['total_price'],
            'details' => $fee['details'],
            'items' => $resolved['items'],
            'lines' => $resolved['lines'],
        ];
    }

    /**
     * @param  list<array{product_uuid: string, quantity: float|int|string, notes?: ?string}>  $items
     * @return array{category: string, quantity: float, line_amounts: list<float>, lines: list<array{product_id: int, quantity: float, notes: ?string}>, items: list<array<string, mixed>>}
     */
    private function resolveItems(array $items): array
    {
        $merged = [];

        foreach ($items as $item) {
            $uuid = (string) $item['product_uuid'];

            if (! isset($merged[$uuid])) {
                $merged[$uuid] = [
                    'quantity' => 0.0,
                    'notes' => null,
                ];
            }

            $merged[$uuid]['quantity'] += (float) $item['quantity'];

            if (! empty($item['notes'])) {
                $merged[$uuid]['notes'] = $item['notes'];
            }
        }

        $products = Product::query()
            ->whereIn('uuid', array_keys($merged))
            ->get()
            ->keyBy('uuid');

        $categories = [];
        $quantity = 0.0;
        $lineAmounts = [];
        $lines = [];
        $preview = [];

        foreach ($merged as $uuid => $row) {
            /** @var Product|null $product */
            $product = $products->get($uuid);

            if ($product === null || ! $product->is_active) {
                throw ValidationException::withMessages([
                    'items' => 'Produk tidak tersedia.',
                ]);
            }

            if ((float) $row['quantity'] < (float) $product->min_order) {
                throw ValidationException::withMessages([
                    'items' => sprintf(
                        '%s minimal %s %s.',
                        $product->name,
                        $this->formatQty((float) $product->min_order),
                        $product->unit,
                    ),
                ]);
            }

            $categories[$product->category] = true;
            $quantity += (float) $row['quantity'];
            $lineAmount = (float) $product->base_price * (float) $row['quantity'];
            $lineAmounts[] = $lineAmount;
            $lines[] = [
                'product_id' => $product->id,
                'quantity' => (float) $row['quantity'],
                'notes' => $row['notes'],
            ];
            $preview[] = [
                'product_uuid' => $product->uuid,
                'code' => $product->code,
                'name' => $product->name,
                'unit' => $product->unit,
                'quantity' => (float) $row['quantity'],
                'unit_price' => (float) $product->base_price,
                'subtotal' => round($lineAmount, 2),
                'notes' => $row['notes'],
            ];
        }

        if (count($categories) !== 1) {
            throw ValidationException::withMessages([
                'items' => 'Satu pesanan hanya boleh berisi satu kategori produk.',
            ]);
        }

        return [
            'category' => (string) array_key_first($categories),
            'quantity' => $quantity,
            'line_amounts' => $lineAmounts,
            'lines' => $lines,
            'items' => $preview,
        ];
    }

    private function formatQty(float $value): string
    {
        $formatted = number_format($value, 2, '.', '');

        return rtrim(rtrim($formatted, '0'), '.');
    }
}
