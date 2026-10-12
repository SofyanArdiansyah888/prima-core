<?php

namespace Modules\Customer\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Customer\Support\PhoneNumber;

class LoginCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');

        if (is_string($phone)) {
            $this->merge(['phone' => PhoneNumber::normalize($phone)]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ];
    }
}
