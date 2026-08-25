<?php

namespace Modules\Branch\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Shared\Concerns\HasUuid;

class Branch extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'name',
        'address',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function batchingPlants(): HasMany
    {
        return $this->hasMany(BatchingPlant::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
