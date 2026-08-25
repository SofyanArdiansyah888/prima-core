<?php

namespace Modules\Branch\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'region' => ['required', 'string', 'min:3', 'max:6', 'regex:/^[A-Za-z0-9]+$/'],
            'code' => ['nullable', 'string', 'max:32', 'regex:/^BR-[A-Z0-9]{3,6}-[0-9]{2}$/', Rule::unique('branches', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('region')) {
            $this->merge(['region' => strtoupper($this->input('region'))]);
        }
        if ($this->filled('code')) {
            $this->merge(['code' => strtoupper($this->input('code'))]);
        }
    }
}
