<?php

namespace Modules\PaymentReturn\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Shared\Concerns\HasUuid;
use Modules\Shared\Concerns\ScopedByPlant;
use Modules\Shared\Enums\UserRole;

/**
 * Berita Acara (BA) retur / pengembalian pembayaran sebagian.
 * Disetujui berurutan: Manager → Kepala Divisi → Keuangan → Direksi, lalu dana ditransfer keuangan.
 */
class PaymentReturn extends Model
{
    use HasUuid, ScopedByPlant;

    public const STATUS_REJECTED = 'REJECTED';

    public const STATUS_APPROVED = 'APPROVED';

    public const STATUS_REFUNDED = 'REFUNDED';

    /**
     * Tahap approval berurutan: status menunggu → role penyetuju.
     *
     * @var array<string, UserRole>
     */
    public const STEPS = [
        'PENDING_MANAGER' => UserRole::Manager,
        'PENDING_KADIV' => UserRole::KepalaDivisi,
        'PENDING_FINANCE' => UserRole::Keuangan,
        'PENDING_DIRECTOR' => UserRole::Direksi,
    ];

    /** Status yang masih mengikat volume/nominal (belum ditolak). */
    public const ACTIVE_STATUSES = ['PENDING_MANAGER', 'PENDING_KADIV', 'PENDING_FINANCE', 'PENDING_DIRECTOR', 'APPROVED', 'REFUNDED'];

    protected $fillable = [
        'uuid',
        'code',
        'order_id',
        'batching_plant_id',
        'subtotal',
        'ppn',
        'amount',
        'reason',
        'customer_bank_name',
        'customer_bank_account',
        'customer_account_name',
        'status',
        'created_by_id',
        'approved_at',
        'rejected_at',
        'refunded_at',
        'refunded_by_id',
        'refund_reference',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'ppn' => 'decimal:2',
            'amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            'PENDING_MANAGER' => 'Menunggu Manager',
            'PENDING_KADIV' => 'Menunggu Kepala Divisi',
            'PENDING_FINANCE' => 'Menunggu Keuangan',
            'PENDING_DIRECTOR' => 'Menunggu Direksi',
            self::STATUS_APPROVED => 'Disetujui · Menunggu Transfer',
            self::STATUS_REFUNDED => 'Dana Dikembalikan',
            self::STATUS_REJECTED => 'Ditolak',
            default => $status,
        };
    }

    /** Role yang berhak memutuskan tahap saat ini; null bila tidak ada tahap approval aktif. */
    public function currentStepRole(): ?UserRole
    {
        return self::STEPS[$this->status] ?? null;
    }

    public function isAwaiting(User $user): bool
    {
        $role = $this->currentStepRole();

        return $role !== null && $user->role === $role;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PaymentReturnItem::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PaymentReturnApproval::class)->orderBy('id');
    }
}
