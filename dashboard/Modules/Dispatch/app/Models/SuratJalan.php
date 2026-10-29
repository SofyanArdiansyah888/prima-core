<?php

namespace Modules\Dispatch\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Shared\Concerns\HasUuid;

class SuratJalan extends Model
{
    use HasUuid;

    /** Ritase yang masih di jalan / belum diserahterimakan. */
    public const ACTIVE_STATUSES = ['PREPARED', 'DEPARTED', 'ON_THE_WAY', 'ARRIVED', 'UNLOADING'];

    public const FINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'RETURNED'];

    protected $fillable = [
        'uuid',
        'code',
        'batching_plant_id',
        'driver_id',
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

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true);
    }

    /**
     * Tandai `delivered_at` pesanan bila seluruh kuantitas sudah terkirim dan
     * tidak ada ritase aktif tersisa; kosongkan lagi bila belum. Status order
     * tetap ON_DELIVERY sampai pelanggan konfirmasi / auto-finish 48 jam.
     *
     * @param  iterable<int>  $orderIds
     */
    public static function syncOrdersDeliveredAt(iterable $orderIds): void
    {
        foreach ($orderIds as $orderId) {
            $order = Order::with('items')->find($orderId);
            if (! $order || $order->status === 'COMPLETED') {
                continue;
            }

            $allFulfilled = $order->items->every(fn ($i) => (float) $i->fulfilled_quantity >= (float) $i->quantity);
            $hasActiveSj = SuratJalanItem::where('order_id', $orderId)
                ->whereHas('suratJalan', fn ($q) => $q->whereIn('status', self::ACTIVE_STATUSES))
                ->exists();

            if ($allFulfilled && ! $hasActiveSj) {
                if (! $order->delivered_at) {
                    $order->update(['delivered_at' => now()]);
                }
            } elseif ($order->delivered_at) {
                $order->update(['delivered_at' => null]);
            }
        }
    }

    public function items(): HasMany
    {
        return $this->hasMany(SuratJalanItem::class);
    }
}
