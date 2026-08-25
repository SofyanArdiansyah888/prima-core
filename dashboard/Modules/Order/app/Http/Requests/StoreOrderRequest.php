<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_type' => ['required', 'string', 'in:B2C,B2B_PARTNER'],
            'project_title' => ['required', 'string', 'max:255'],
            'delivery_address' => ['required', 'string'],
            'delivery_lat' => ['nullable', 'numeric'],
            'delivery_lng' => ['nullable', 'numeric'],
            'batching_plant_id' => ['required', 'exists:batching_plants,id'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'delivery_fee' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'max:64'],
            'payment_status' => ['required', 'string', 'in:PENDING,PAID,APPROVED_CREDIT'],
            'po_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.1'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
