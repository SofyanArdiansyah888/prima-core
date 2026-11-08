<?php

namespace Modules\Dispatch\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\WorkOrder\Models\WorkOrder;

class StoreSuratJalanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'batching_plant_id' => ['required', 'exists:batching_plants,id'],
            'vehicle_number' => ['required', 'string', 'max:32'],
            'vehicle_type' => ['required', 'string', 'max:64'],
            'driver_id' => ['nullable', Rule::exists('users', 'id')->where('role', UserRole::Driver->value)],
            'driver_name' => ['required', 'string', 'max:128'],
            'driver_phone' => ['nullable', 'string', 'max:50'],
            'gross_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'tare_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'net_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'nota_timbangan_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_id' => ['required', 'exists:orders,id', function (string $attribute, mixed $value, Closure $fail) {
                if ($reason = Order::productionBlockReason(Order::find($value))) {
                    $fail($reason);
                }
            }],
            'items.*.work_order_id' => ['nullable', 'exists:work_orders,id'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity_delivered' => ['required', 'numeric', 'min:0.1'],
            'items.*.destination_customer_name' => ['required', 'string'],
            'items.*.destination_project_title' => ['nullable', 'string'],
            'items.*.destination_address' => ['required', 'string'],
            'items.*.destination_lat' => ['nullable', 'numeric'],
            'items.*.destination_lng' => ['nullable', 'numeric'],
            'items.*.delivery_sequence' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            if (empty($items)) {
                return;
            }

            // Check if any product does not allow combined delivery
            $orderIds = array_unique(array_column($items, 'order_id'));
            $isMultiOrder = count($orderIds) > 1;

            foreach ($items as $index => $item) {
                $product = Product::find($item['product_id'] ?? null);
                if ($product && ! $product->allow_combined_delivery && $isMultiOrder) {
                    $validator->errors()->add(
                        "items.{$index}.product_id",
                        "Produk '{$product->name}' tidak mengizinkan pengiriman gabungan multi-customer. Satu ritase pengangkutan harus khusus untuk satu pesanan/customer."
                    );
                }
            }

            $this->validatePlantAccess($validator, $items);
            $this->validateRemainingQuantities($validator, $items);
        });
    }

    /**
     * Pemisahan data per batching plant: plant surat jalan harus boleh diakses user,
     * setiap pesanan harus dari plant yang sama, dan SPK harus milik pesanan tersebut.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function validatePlantAccess($validator, array $items): void
    {
        $user = $this->user();
        $plantId = (int) $this->input('batching_plant_id');

        if (! $user->canAccessPlant($plantId)) {
            $validator->errors()->add('batching_plant_id', 'Anda tidak memiliki akses ke batching plant ini.');

            return;
        }

        foreach ($items as $index => $item) {
            $order = Order::query()->find($item['order_id'] ?? null, ['id', 'code', 'batching_plant_id']);
            if (! $order) {
                continue;
            }

            if ((int) $order->batching_plant_id !== $plantId) {
                $validator->errors()->add("items.{$index}.order_id", "Pesanan {$order->code} bukan milik batching plant surat jalan ini.");

                continue;
            }

            if (! empty($item['work_order_id'])) {
                $belongs = WorkOrder::query()->whereKey($item['work_order_id'])->where('order_id', $order->id)->exists();
                if (! $belongs) {
                    $validator->errors()->add("items.{$index}.work_order_id", "SPK tidak sesuai dengan pesanan {$order->code}.");
                }
            }
        }
    }

    /**
     * Volume ritase tidak boleh melebihi sisa pesanan (dipesan − sudah dikirim)
     * maupun sisa SPK (target − sudah didispatch). Beberapa stop untuk item yang sama dijumlahkan.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function validateRemainingQuantities($validator, array $items): void
    {
        $perOrderItem = [];
        $perWorkOrder = [];

        foreach ($items as $index => $item) {
            $qty = (float) ($item['quantity_delivered'] ?? 0);
            if (! isset($item['order_id'], $item['product_id'])) {
                continue;
            }

            $key = $item['order_id'].':'.$item['product_id'];
            $perOrderItem[$key]['qty'] = ($perOrderItem[$key]['qty'] ?? 0) + $qty;
            $perOrderItem[$key]['index'] = $index;

            if (! empty($item['work_order_id'])) {
                $perWorkOrder[$item['work_order_id']]['qty'] = ($perWorkOrder[$item['work_order_id']]['qty'] ?? 0) + $qty;
                $perWorkOrder[$item['work_order_id']]['index'] = $index;
            }
        }

        foreach ($perOrderItem as $key => $row) {
            [$orderId, $productId] = explode(':', $key);
            $orderItem = OrderItem::query()->with('order:id,code')->where('order_id', $orderId)->where('product_id', $productId)->first();

            if (! $orderItem) {
                $validator->errors()->add("items.{$row['index']}.product_id", 'Produk ini tidak ada dalam pesanan yang dipilih.');

                continue;
            }

            $remaining = round((float) $orderItem->quantity - (float) $orderItem->fulfilled_quantity, 2);
            if ($row['qty'] - $remaining > 0.0001) {
                $validator->errors()->add(
                    "items.{$row['index']}.quantity_delivered",
                    'Volume melebihi sisa pesanan '.$orderItem->order?->code.': sisa '.$this->qty(max(0, $remaining)).' '.$orderItem->unit
                        .' (dipesan '.$this->qty($orderItem->quantity).', sudah dikirim '.$this->qty($orderItem->fulfilled_quantity).').'
                );
            }
        }

        foreach ($perWorkOrder as $workOrderId => $row) {
            $workOrder = WorkOrder::query()->find($workOrderId);
            if (! $workOrder) {
                continue;
            }

            $remaining = round((float) $workOrder->target_quantity - (float) $workOrder->dispatched_quantity, 2);
            if ($row['qty'] - $remaining > 0.0001) {
                $validator->errors()->add(
                    "items.{$row['index']}.quantity_delivered",
                    "Volume melebihi sisa SPK {$workOrder->code}: sisa ".$this->qty(max(0, $remaining))." {$workOrder->unit}."
                );
            }
        }
    }

    private function qty(mixed $value): string
    {
        return rtrim(rtrim(number_format((float) $value, 2, ',', '.'), '0'), ',');
    }
}
