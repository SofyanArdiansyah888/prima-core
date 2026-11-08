<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Shared\Concerns\HasUuid;
use Modules\Shared\Enums\UserRole;

/**
 * @property int $id
 * @property string $uuid
 * @property string|null $code
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property UserRole $role
 * @property bool $is_active
 * @property int|null $branch_id
 */
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuid, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected $fillable = [
        'uuid',
        'code',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        'has_full_plant_access',
        'branch_id',
        'email_verified_at',
    ];

    /** @var array<int, int>|null Cache id plant yang boleh diakses (null = semua). */
    private ?array $plantIdsCache = null;

    private bool $plantIdsResolved = false;

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'has_full_plant_access' => 'boolean',
        ];
    }

    /**
     * Admin (super admin) atau user dengan saklar "Akses semua batching plant".
     */
    public function hasFullPlantAccess(): bool
    {
        return $this->isAdmin() || (bool) $this->has_full_plant_access;
    }

    /**
     * Id batching plant yang boleh diakses; `null` berarti semua plant.
     *
     * @return array<int, int>|null
     */
    public function accessiblePlantIds(): ?array
    {
        if ($this->hasFullPlantAccess()) {
            return null;
        }

        if (! $this->plantIdsResolved) {
            $this->plantIdsCache = $this->batchingPlants()->pluck('batching_plants.id')->map(fn ($id) => (int) $id)->all();
            $this->plantIdsResolved = true;
        }

        return $this->plantIdsCache;
    }

    public function canAccessPlant(?int $plantId): bool
    {
        $ids = $this->accessiblePlantIds();

        return $ids === null || ($plantId !== null && in_array($plantId, $ids, true));
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isSales(): bool
    {
        return $this->role === UserRole::Sales;
    }

    public function isDriver(): bool
    {
        return $this->role === UserRole::Driver;
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function batchingPlants(): BelongsToMany
    {
        return $this->belongsToMany(BatchingPlant::class)->withTimestamps();
    }

    public function suratJalans(): HasMany
    {
        return $this->hasMany(SuratJalan::class, 'driver_id');
    }
}
