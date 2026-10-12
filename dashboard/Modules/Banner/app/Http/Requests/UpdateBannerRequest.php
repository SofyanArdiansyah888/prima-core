<?php

namespace Modules\Banner\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'badge' => ['required', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cta_label' => ['required', 'string', 'max:80'],
            'category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'image' => ['nullable', 'image', 'max:4096'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'category_id' => $this->input('category_id') === '' ? null : $this->input('category_id'),
            'is_active' => $this->boolean('is_active'),
            'starts_at' => $this->input('starts_at') === '' ? null : $this->input('starts_at'),
            'ends_at' => $this->input('ends_at') === '' ? null : $this->input('ends_at'),
        ]);
    }
}
