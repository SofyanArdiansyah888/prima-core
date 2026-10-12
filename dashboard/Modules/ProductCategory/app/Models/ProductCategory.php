<?php

namespace Modules\ProductCategory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Modules\Product\Models\Product;
use Modules\Shared\Concerns\HasUuid;

class ProductCategory extends Model
{
    use HasUuid;

    protected $fillable = [
        'uuid',
        'code',
        'name',
        'slug',
        'default_unit',
        'default_max_trip_capacity',
        'default_allow_combined_delivery',
        'sort_order',
        'show_in_catalog',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_max_trip_capacity' => 'decimal:2',
            'default_allow_combined_delivery' => 'boolean',
            'sort_order' => 'integer',
            'show_in_catalog' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    /**
     * @return Collection<int, ProductCategory>
     */
    public static function activeOrdered(): Collection
    {
        return static::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return list<array{value: string, label: string, default_unit: string, default_max_trip_capacity: float, default_allow_combined_delivery: bool}>
     */
    public static function formOptions(?string $includeSlug = null): array
    {
        $rows = static::query()
            ->where(function ($query) use ($includeSlug) {
                $query->where('is_active', true);
                if ($includeSlug) {
                    $query->orWhere('slug', $includeSlug);
                }
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $rows->map(fn (self $category) => [
            'value' => $category->slug,
            'label' => $category->name,
            'default_unit' => $category->default_unit,
            'default_max_trip_capacity' => (float) $category->default_max_trip_capacity,
            'default_allow_combined_delivery' => (bool) $category->default_allow_combined_delivery,
        ])->all();
    }
}
