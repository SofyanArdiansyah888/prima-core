<?php

namespace Modules\Banner\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Concerns\HasUuid;

class Banner extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'badge',
        'title',
        'description',
        'cta_label',
        'category_id',
        'image_path',
        'sort_order',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function imageUrl(): string
    {
        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        $url = Storage::disk('public')->url($this->image_path);

        if (! app()->runningInConsole() && request()->hasHeader('Host')) {
            $parsed = parse_url($url);
            $host = $parsed['host'] ?? '';
            if ($host === 'localhost' || $host === '127.0.0.1') {
                $base = rtrim(request()->getSchemeAndHttpHost(), '/');
                $path = $parsed['path'] ?? ('/storage/'.ltrim($this->image_path, '/'));

                return $base.$path;
            }
        }

        return $url;
    }

    /**
     * @param  Builder<Banner>  $query
     * @return Builder<Banner>
     */
    public function scopeVisible(Builder $query): Builder
    {
        $now = now();

        return $query
            ->where('is_active', true)
            ->where(function (Builder $inner) use ($now) {
                $inner->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function (Builder $inner) use ($now) {
                $inner->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            });
    }
}
