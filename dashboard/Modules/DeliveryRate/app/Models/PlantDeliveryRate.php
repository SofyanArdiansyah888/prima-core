<?php

namespace Modules\DeliveryRate\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Shared\Concerns\HasUuid;

class PlantDeliveryRate extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'batching_plant_id',
        'product_category',
        'min_distance_km',
        'max_distance_km',
        'rate_type',
        'base_fee',
        'cost_per_km_unit',
        'min_charge',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_distance_km' => 'decimal:2',
            'max_distance_km' => 'decimal:2',
            'base_fee' => 'decimal:2',
            'cost_per_km_unit' => 'decimal:2',
            'min_charge' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }
}
