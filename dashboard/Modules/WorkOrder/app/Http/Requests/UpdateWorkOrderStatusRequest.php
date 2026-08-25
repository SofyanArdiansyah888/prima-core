<?php

namespace Modules\WorkOrder\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:SCHEDULED,IN_PRODUCTION,READY_FOR_DISPATCH,COMPLETED,CANCELLED'],
            'produced_quantity' => ['nullable', 'numeric', 'min:0'],
            'dispatched_quantity' => ['nullable', 'numeric', 'min:0'],
            'production_notes' => ['nullable', 'string'],
        ];
    }
}
