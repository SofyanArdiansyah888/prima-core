<?php

namespace Modules\Customer\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Order\Models\Order;
use Modules\Shared\Concerns\HasUuid;

class Customer extends Authenticatable
{
    use HasApiTokens, HasUuid, Notifiable;

    protected $fillable = [
        'uuid',
        'name',
        'phone',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Pelanggan tidak terikat plant; staf terbatas hanya melihat pelanggan
     * yang pernah memesan di batching plant yang ditugaskan kepadanya.
     *
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

        return $query->whereHas('orders', fn (Builder $q) => $q->whereIn('batching_plant_id', $ids));
    }
}
