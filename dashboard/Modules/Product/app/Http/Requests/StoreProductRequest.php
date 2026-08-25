<?php

namespace Modules\Product\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:32', 'unique:products,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:readymix,cement,mortar,grout,additive'],
            'unit' => ['required', 'string', 'max:16'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'max_trip_capacity' => ['required', 'numeric', 'min:0.1'],
            'allow_combined_delivery' => ['required', 'boolean'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'slump' => ['nullable', 'string', 'max:64'],
            'recommended_for' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'tag' => ['nullable', 'string', 'max:64'],
            'specs' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
