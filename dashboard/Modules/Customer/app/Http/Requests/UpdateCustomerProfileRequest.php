<?php

namespace Modules\Customer\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Customer\Models\Customer;
use Modules\Customer\Support\PhoneNumber;

class UpdateCustomerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof Customer;
    }

    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');
        $payload = [
            'phone' => is_string($phone) ? PhoneNumber::normalize($phone) : $phone,
        ];

        if ($this->input('email') === '') {
            $payload['email'] = null;
        }

        $this->merge($payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Customer $customer */
        $customer = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50', Rule::unique('customers', 'phone')->ignore($customer->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer->id)],
        ];
    }
}
