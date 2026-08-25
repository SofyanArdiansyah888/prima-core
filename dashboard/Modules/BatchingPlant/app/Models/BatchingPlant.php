<?php

namespace Modules\BatchingPlant\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Branch\Models\Branch;
use Modules\Shared\Concerns\HasUuid;
use Modules\Shared\Enums\PlantStatus;

class BatchingPlant extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'branch_id',
        'name',
        'address',
        'phone',
        'lat',
        'lng',
        'daily_capacity_m3',
        'status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'daily_capacity_m3' => 'integer',
            'status' => PlantStatus::class,
            'is_active' => 'boolean',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}
