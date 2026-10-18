<?php

namespace Modules\BatchingPlant\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Shared\Enums\PlantStatus;
use Modules\Shared\Support\PhoneNumber;

class UpdateBatchingPlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['sometimes', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'regex:/^62[0-9]{8,13}$/'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'daily_capacity_m3' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::enum(PlantStatus::class)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'whatsapp.regex' => 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia, contoh 081234567890.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'whatsapp' => $this->normalizeWhatsapp($this->input('whatsapp')),
        ]);
    }

    private function normalizeWhatsapp(mixed $value): ?string
    {
        $international = PhoneNumber::toInternational((string) $value);

        return $international !== '' ? $international : null;
    }
}
