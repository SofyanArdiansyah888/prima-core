<?php

namespace Modules\Shared\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Pembatasan data per batching plant: user hanya melihat data plant yang ditugaskan
 * kepadanya, kecuali admin / user dengan akses semua plant.
 *
 * Model dapat mengganti kolom plant dengan properti `$plantColumn`.
 */
trait ScopedByPlant
{
    public function plantColumn(): string
    {
        return property_exists($this, 'plantColumn') ? $this->plantColumn : 'batching_plant_id';
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        $ids = $user->accessiblePlantIds();
        if ($ids === null) {
            return $query;
        }

        if ($ids === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn($query->qualifyColumn($this->plantColumn()), $ids);
    }
}
