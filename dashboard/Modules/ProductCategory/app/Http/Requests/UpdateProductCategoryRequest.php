<?php

namespace Modules\ProductCategory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'default_unit' => ['required', 'string', 'max:16'],
            'default_max_trip_capacity' => ['required', 'numeric', 'min:0.1'],
            'default_allow_combined_delivery' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'show_in_catalog' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'default_allow_combined_delivery' => $this->boolean('default_allow_combined_delivery'),
            'show_in_catalog' => $this->boolean('show_in_catalog'),
            'is_active' => $this->boolean('is_active'),
        ]);
    }
}
