<?php

namespace Modules\Order\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Customer\Models\Customer;
use Modules\Shared\Concerns\HasUuid;
use Modules\WorkOrder\Models\WorkOrder;

class Order extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'customer_id',
        'code',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_type',
        'project_title',
        'delivery_address',
        'delivery_lat',
        'delivery_lng',
        'batching_plant_id',
        'distance_km',
        'delivery_fee',
        'admin_fee',
        'subtotal',
        'ppn',
        'total_price',
        'payment_method',
        'payment_status',
        'snap_token',
        'snap_redirect_url',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'payment_payload',
        'paid_at',
        'status',
        'po_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'delivery_lat' => 'decimal:7',
            'delivery_lng' => 'decimal:7',
            'distance_km' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'admin_fee' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'ppn' => 'decimal:2',
            'total_price' => 'decimal:2',
            'payment_payload' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class);
    }
}
