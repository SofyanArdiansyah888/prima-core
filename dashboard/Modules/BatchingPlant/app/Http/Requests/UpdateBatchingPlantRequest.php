<?php

namespace Modules\BatchingPlant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Shared\Enums\PlantStatus;

class UpdateBatchingPlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'daily_capacity_m3' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::enum(PlantStatus::class)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
