<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Shared\Enums\UserRole;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::enum(UserRole::class)],
            'branch_id' => [
                Rule::requiredIf(fn () => $this->input('role') === UserRole::User->value),
                'nullable',
                'exists:branches,id',
            ],
            'code' => ['nullable', 'string', 'max:32', 'regex:/^EMP-[A-Z0-9]{2,6}-[0-9]{9}$/', Rule::unique('users', 'code')],
            'is_active' => ['sometimes', 'boolean'],
            'batching_plant_ids' => ['array'],
            'batching_plant_ids.*' => ['integer', 'exists:batching_plants,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $role = $this->input('role');
            $branchId = $this->input('branch_id');
            $plantIds = $this->input('batching_plant_ids', []);

            if ($role === UserRole::Admin->value && empty($branchId)) {
                return;
            }

            if (! empty($plantIds) && $branchId) {
                $invalid = BatchingPlant::query()
                    ->whereIn('id', $plantIds)
                    ->where('branch_id', '!=', $branchId)
                    ->exists();

                if ($invalid) {
                    $validator->errors()->add('batching_plant_ids', 'Semua plant harus berada di cabang yang dipilih.');
                }
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('code')) {
            $this->merge(['code' => strtoupper($this->input('code'))]);
        }
    }
}
