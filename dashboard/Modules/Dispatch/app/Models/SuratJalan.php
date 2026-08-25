<?php

namespace Modules\Dispatch\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Shared\Concerns\HasUuid;

class SuratJalan extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'batching_plant_id',
        'vehicle_number',
        'vehicle_type',
        'driver_name',
        'driver_phone',
        'status',
        'departure_time',
        'arrival_time',
        'gross_weight_kg',
        'tare_weight_kg',
        'net_weight_kg',
        'nota_timbangan_number',
        'telematics',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'departure_time' => 'datetime',
            'arrival_time' => 'datetime',
            'gross_weight_kg' => 'decimal:2',
            'tare_weight_kg' => 'decimal:2',
            'net_weight_kg' => 'decimal:2',
            'telematics' => 'array',
        ];
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SuratJalanItem::class);
    }
}
