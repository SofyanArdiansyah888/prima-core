<?php

namespace Modules\ProductCategory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:32', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('product_categories', 'slug')],
            'default_unit' => ['required', 'string', 'max:16'],
            'default_max_trip_capacity' => ['required', 'numeric', 'min:0.1'],
            'default_allow_combined_delivery' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'show_in_catalog' => ['required', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->input('slug');
        if (is_string($slug) && trim($slug) !== '') {
            $this->merge(['slug' => Str::slug($slug)]);
        } elseif ($this->filled('name')) {
            $this->merge(['slug' => Str::slug((string) $this->input('name'))]);
        }

        $this->merge([
            'default_allow_combined_delivery' => $this->boolean('default_allow_combined_delivery'),
            'show_in_catalog' => $this->boolean('show_in_catalog'),
            'is_active' => $this->has('is_active') ? $this->boolean('is_active') : true,
        ]);
    }
}
