<?php

namespace Modules\Dispatch\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSuratJalanStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:PREPARED,DEPARTED,ON_THE_WAY,ARRIVED,UNLOADING,COMPLETED,RETURNED'],
            'recipient_name' => ['nullable', 'string', 'max:128'],
            'received_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
