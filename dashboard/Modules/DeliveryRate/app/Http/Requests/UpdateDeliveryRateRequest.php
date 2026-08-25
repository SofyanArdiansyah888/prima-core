<?php

namespace Modules\DeliveryRate\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'batching_plant_id' => ['required', 'exists:batching_plants,id'],
            'product_category' => ['nullable', 'string', 'in:readymix,cement,mortar,grout,additive'],
            'min_distance_km' => ['required', 'numeric', 'min:0'],
            'max_distance_km' => ['required', 'numeric', 'gt:min_distance_km'],
            'rate_type' => ['required', 'string', 'in:PER_UNIT_PER_KM,FLAT_PER_TRIP,TIER_RADIUS'],
            'base_fee' => ['required', 'numeric', 'min:0'],
            'cost_per_km_unit' => ['required', 'numeric', 'min:0'],
            'min_charge' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
