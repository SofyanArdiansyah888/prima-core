<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Customer\Models\Customer;

class QuoteDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof Customer;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'delivery_lat' => ['required', 'numeric', 'between:-90,90'],
            'delivery_lng' => ['required', 'numeric', 'between:-180,180'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_uuid' => ['required', 'uuid', 'exists:products,uuid'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
