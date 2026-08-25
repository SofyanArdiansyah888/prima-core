<?php

namespace Modules\WorkOrder\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\Shared\Concerns\HasUuid;

class WorkOrder extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'order_id',
        'product_id',
        'batching_plant_id',
        'assigned_user_id',
        'scheduled_date',
        'scheduled_time_slot',
        'target_quantity',
        'produced_quantity',
        'dispatched_quantity',
        'unit',
        'status',
        'batch_recipe_code',
        'slump_target',
        'production_notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'target_quantity' => 'decimal:2',
            'produced_quantity' => 'decimal:2',
            'dispatched_quantity' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
