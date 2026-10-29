<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string'],
            'payment_status' => ['required', 'string', 'in:PENDING,PAID,FAILED'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
