<?php

namespace Modules\Dispatch\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;

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
        });
    }
}
