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

    /**
     * Satu nomor per plant: nomor WhatsApp sekaligus nomor sales & telepon plant.
     *
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if ($key === null && is_array($data) && array_key_exists('whatsapp', $data)) {
            $data['phone'] = $data['whatsapp'] !== null ? PhoneNumber::toLocal($data['whatsapp']) : null;
        }

        return $data;
    }

    private function normalizeWhatsapp(mixed $value): ?string
    {
        $international = PhoneNumber::toInternational((string) $value);

        return $international !== '' ? $international : null;
    }
}
