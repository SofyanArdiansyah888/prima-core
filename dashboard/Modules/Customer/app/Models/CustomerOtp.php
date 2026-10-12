<?php

namespace Modules\Customer\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerOtp extends Model
{
    protected $fillable = [
        'phone',
        'purpose',
        'code_hash',
        'attempts',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
        ];
    }
}
