<?php

namespace Modules\Order\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Customer\Models\Customer;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Observers\OrderObserver;
use Modules\Shared\Concerns\HasUuid;
use Modules\WorkOrder\Models\WorkOrder;

#[ObservedBy([OrderObserver::class])]

class Order extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'customer_id',
        'code',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_type',
        'project_title',
        'delivery_address',
        'delivery_lat',
        'delivery_lng',
        'batching_plant_id',
        'distance_km',
        'delivery_fee',
        'admin_fee',
        'subtotal',
        'ppn',
        'total_price',
        'payment_method',
        'payment_status',
        'snap_token',
        'snap_redirect_url',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'payment_payload',
        'paid_at',
        'status',
        'approved_at',
        'approved_by_id',
        'survey_notes',
        'rejection_reason',
        'delivered_at',
        'customer_confirmed_at',
        'completed_by',
        'cancelled_at',
        'cancelled_by_id',
        'cancellation_reason',
        'refunded_at',
        'refunded_by_id',
        'refund_amount',
        'refund_reference',
        'po_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'delivery_lat' => 'decimal:7',
            'delivery_lng' => 'decimal:7',
            'distance_km' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'admin_fee' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'ppn' => 'decimal:2',
            'total_price' => 'decimal:2',
            'payment_payload' => 'array',
            'paid_at' => 'datetime',
            'approved_at' => 'datetime',
            'delivered_at' => 'datetime',
            'customer_confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'refunded_at' => 'datetime',
            'refund_amount' => 'decimal:2',
        ];
    }

    /** `APPROVED_CREDIT` = nilai lama untuk kredit B2B yang diperlakukan lunas. */
    public const PAID_STATUSES = ['PAID', 'APPROVED_CREDIT'];

    /** Status pesanan yang boleh diterbitkan SPK / Surat Jalan (asal sudah lunas). */
    public const PRODUCTION_STATUSES = ['CONFIRMED', 'PROCESSING', 'ON_DELIVERY'];

    public function isPaid(): bool
    {
        return in_array($this->payment_status, self::PAID_STATUSES, true);
    }

    public function isReadyForProduction(): bool
    {
        return $this->isPaid() && in_array($this->status, self::PRODUCTION_STATUSES, true);
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeReadyForProduction($query): void
    {
        $query->whereIn('payment_status', self::PAID_STATUSES)
            ->whereIn('status', self::PRODUCTION_STATUSES);
    }

    public static function productionBlockReason(?self $order): ?string
    {
        if (! $order) {
            return 'Pesanan tidak ditemukan.';
        }
        if (! in_array($order->status, self::PRODUCTION_STATUSES, true)) {
            return "Pesanan {$order->code} belum disetujui sales atau sudah selesai/dibatalkan.";
        }
        if (! $order->isPaid()) {
            return "Pesanan {$order->code} belum lunas. SPK dan Surat Jalan hanya bisa diterbitkan setelah pembayaran diterima.";
        }

        return null;
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }

    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function batchingPlant(): BelongsTo
    {
        return $this->belongsTo(BatchingPlant::class);
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class);
    }

    public function suratJalanItems(): HasMany
    {
        return $this->hasMany(SuratJalanItem::class);
    }
}
