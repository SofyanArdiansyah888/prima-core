<?php

namespace Modules\Order\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Shared\Concerns\HasUuid;

/**
 * Foto bukti kehadiran di lokasi proyek oleh sales (survei) atau sopir (pengantaran).
 */
class SitePhoto extends Model
{
    use HasUuid;

    public const DISK = 'public';

    /** Radius (meter) dianggap "di lokasi proyek". */
    public const ON_SITE_RADIUS_M = 300;

    protected $fillable = [
        'uuid',
        'order_id',
        'surat_jalan_id',
        'user_id',
        'role',
        'path',
        'lat',
        'lng',
        'accuracy_m',
        'distance_m',
        'notes',
        'taken_at',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'accuracy_m' => 'decimal:1',
            'distance_m' => 'integer',
            'taken_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function suratJalan(): BelongsTo
    {
        return $this->belongsTo(SuratJalan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * URL publik foto. Dibangun dari host request (bukan APP_URL) agar tetap benar
     * walau APP_URL server masih localhost; skema https dibaca dari proxy (trustProxies).
     */
    public function url(): string
    {
        if (request()->hasHeader('Host')) {
            return rtrim(request()->getSchemeAndHttpHost(), '/').'/storage/'.ltrim($this->path, '/');
        }

        return Storage::disk(self::DISK)->url($this->path);
    }

    /**
     * @return array<string, mixed>
     */
    public function toApi(): array
    {
        return [
            'uuid' => $this->uuid,
            'role' => $this->role,
            'url' => $this->url(),
            'lat' => $this->lat !== null ? (float) $this->lat : null,
            'lng' => $this->lng !== null ? (float) $this->lng : null,
            'accuracy_m' => $this->accuracy_m !== null ? (float) $this->accuracy_m : null,
            'distance_m' => $this->distance_m,
            'on_site' => $this->distance_m !== null ? $this->distance_m <= self::ON_SITE_RADIUS_M : null,
            'notes' => $this->notes,
            'taken_by' => $this->user?->name,
            'taken_at' => ($this->taken_at ?? $this->created_at)?->toIso8601String(),
        ];
    }
}
