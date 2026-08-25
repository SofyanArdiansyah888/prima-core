<?php

namespace Modules\WorkOrder\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'exists:orders,id'],
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
}
