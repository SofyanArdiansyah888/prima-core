<?php

namespace Modules\WorkOrder\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\WorkOrder\Models\WorkOrder;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'exists:orders,id', function (string $attribute, mixed $value, Closure $fail) {
                if ($reason = Order::productionBlockReason(Order::find($value))) {
                    $fail($reason);
                }
            }],
            'product_id' => ['required', 'exists:products,id'],
            'batching_plant_id' => ['required', 'exists:batching_plants,id'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'scheduled_date' => ['required', 'date'],
            'scheduled_time_slot' => ['nullable', 'string', 'max:64'],
            'target_quantity' => ['required', 'numeric', 'min:0.1'],
            'batch_recipe_code' => ['nullable', 'string', 'max:64'],
            'slump_target' => ['nullable', 'string', 'max:64'],
            'production_notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Total target seluruh SPK aktif untuk satu item pesanan tidak boleh melebihi jumlah yang dipesan.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Pemisahan data per batching plant
            $user = $this->user();
            $order = Order::query()->find($this->input('order_id'));
            if (! $user->canAccessPlant($order?->batching_plant_id)) {
                $validator->errors()->add('order_id', 'Pesanan ini milik batching plant lain.');

                return;
            }
            if (! $user->canAccessPlant((int) $this->input('batching_plant_id'))) {
                $validator->errors()->add('batching_plant_id', 'Anda tidak memiliki akses ke batching plant ini.');

                return;
            }

            $orderItem = OrderItem::query()
                ->where('order_id', $this->input('order_id'))
                ->where('product_id', $this->input('product_id'))
                ->first();

            if (! $orderItem) {
                $validator->errors()->add('product_id', 'Produk ini tidak ada dalam pesanan yang dipilih.');

                return;
            }

            $scheduled = (float) WorkOrder::query()
                ->where('order_id', $orderItem->order_id)
                ->where('product_id', $orderItem->product_id)
                ->where('status', '!=', 'CANCELLED')
                ->sum('target_quantity');

            $remaining = round((float) $orderItem->quantity - $scheduled, 2);
            if ((float) $this->input('target_quantity') - $remaining > 0.0001) {
                $fmt = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', '.'), '0'), ',');
                $validator->errors()->add(
                    'target_quantity',
                    'Target melebihi sisa pesanan yang belum dibuatkan SPK: sisa '.$fmt(max(0, $remaining)).' '.$orderItem->unit
                        .' (dipesan '.$fmt($orderItem->quantity).', sudah ada SPK '.$fmt($scheduled).').'
                );
            }
        });
    }
}
