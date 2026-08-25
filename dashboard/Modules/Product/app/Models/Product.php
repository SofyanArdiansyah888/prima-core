<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Shared\Concerns\HasUuid;

class Product extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'name',
        'category',
        'unit',
        'base_price',
        'max_trip_capacity',
        'allow_combined_delivery',
        'min_order',
        'slump',
        'recommended_for',
        'description',
        'tag',
        'specs',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'max_trip_capacity' => 'decimal:2',
            'allow_combined_delivery' => 'boolean',
            'min_order' => 'decimal:2',
            'specs' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
