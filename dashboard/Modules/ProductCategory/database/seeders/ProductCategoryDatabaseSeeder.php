<?php

namespace Modules\ProductCategory\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\ProductCategory\Models\ProductCategory;

class ProductCategoryDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['CAT-01', 'Ready Mix Concrete', 'readymix', 'm³', 7, false, 1],
            ['CAT-02', 'Semen & Curah', 'cement', 'Sak', 200, true, 2],
            ['CAT-03', 'Mortar & Instan', 'mortar', 'Sak', 250, true, 3],
            ['CAT-04', 'Grout & Spesial', 'grout', 'Sak', 250, true, 4],
            ['CAT-05', 'Admixture & Additive', 'additive', 'Sak', 250, true, 5],
        ];

        foreach ($rows as [$code, $name, $slug, $unit, $capacity, $combined, $sort]) {
            $payload = [
                'code' => $code,
                'name' => $name,
                'default_unit' => $unit,
                'default_max_trip_capacity' => $capacity,
                'default_allow_combined_delivery' => $combined,
                'sort_order' => $sort,
                'show_in_catalog' => true,
                'is_active' => true,
            ];

            $existing = ProductCategory::query()->where('slug', $slug)->first();
            if ($existing) {
                $existing->update($payload);

                continue;
            }

            ProductCategory::query()->create([
                ...$payload,
                'slug' => $slug,
                'uuid' => (string) Str::uuid(),
            ]);
        }
    }
}
