<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Concerns\HasUuid;

class Product extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'name',
        'category',
        'category_id',
        'image_path',
        'unit',
        'base_price',
        'max_trip_capacity',
        'allow_combined_delivery',
        'min_order',
        'slump',
        'recommended_for',
        'description',
        'tag',
        'specs',
        'is_active',
        'is_featured',
        'is_best_seller',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'max_trip_capacity' => 'decimal:2',
            'allow_combined_delivery' => 'boolean',
            'min_order' => 'decimal:2',
            'specs' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_best_seller' => 'boolean',
        ];
    }

    public function imageUrl(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

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

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            if ($product->category_id) {
                $master = ProductCategory::query()->find($product->category_id);
                if ($master) {
                    $product->category = $master->slug;
                }

                return;
            }

            if (is_string($product->category) && $product->category !== '') {
                $master = ProductCategory::query()->where('slug', $product->category)->first();
                if ($master) {
                    $product->category_id = $master->id;
                }
            }
        });
    }

    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
}
