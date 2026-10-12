<?php

namespace Modules\Customer\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Customer\Support\PhoneNumber;

class RegisterCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');

        $this->merge([
            'phone' => is_string($phone) ? PhoneNumber::normalize($phone) : $phone,
            'email' => $this->input('email') === '' ? null : $this->input('email'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^08\d{8,12}$/', 'unique:customers,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'code' => ['required', 'string', 'size:6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Nomor WhatsApp tidak valid.',
            'phone.unique' => 'Nomor WhatsApp sudah terdaftar.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'code.required' => 'Masukkan kode verifikasi WhatsApp.',
            'code.size' => 'Kode verifikasi harus 6 digit.',
        ];
    }
}
