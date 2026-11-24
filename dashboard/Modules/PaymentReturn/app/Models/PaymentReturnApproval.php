<?php

namespace Modules\PaymentReturn\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentReturnApproval extends Model
{
    protected $fillable = [
        'payment_return_id',
        'step',
        'user_id',
        'decision',
        'notes',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
        ];
    }

    public function paymentReturn(): BelongsTo
    {
        return $this->belongsTo(PaymentReturn::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
