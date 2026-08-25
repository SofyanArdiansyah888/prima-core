<?php

namespace Modules\DeliveryRate\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\DeliveryRate\Models\PlantDeliveryRate;

class DeliveryRateDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $plants = BatchingPlant::all();

        foreach ($plants as $plant) {
            // Zone 1: 0 - 10 km (Dekat / Ring 1)
            PlantDeliveryRate::query()->updateOrCreate(
                [
                    'batching_plant_id' => $plant->id,
                    'min_distance_km' => 0,
                    'max_distance_km' => 10,
                    'product_category' => null,
                ],
                [
                    'rate_type' => 'PER_UNIT_PER_KM',
                    'base_fee' => 150000,
                    'cost_per_km_unit' => 12000,
                    'min_charge' => 250000,
                    'notes' => 'Zona 1: Radius 0-10 Km di sekitar ' . $plant->name,
                    'is_active' => true,
                ]
            );

            // Zone 2: 10 - 25 km (Menengah / Ring 2)
            PlantDeliveryRate::query()->updateOrCreate(
                [
                    'batching_plant_id' => $plant->id,
                    'min_distance_km' => 10,
                    'max_distance_km' => 25,
                    'product_category' => null,
                ],
                [
                    'rate_type' => 'PER_UNIT_PER_KM',
                    'base_fee' => 250000,
                    'cost_per_km_unit' => 16000,
                    'min_charge' => 450000,
                    'notes' => 'Zona 2: Radius 10-25 Km di sekitar ' . $plant->name,
                    'is_active' => true,
                ]
            );

            // Zone 3: 25 - 60 km (Jauh / Ring 3)
            PlantDeliveryRate::query()->updateOrCreate(
                [
                    'batching_plant_id' => $plant->id,
                    'min_distance_km' => 25,
                    'max_distance_km' => 60,
                    'product_category' => null,
                ],
                [
                    'rate_type' => 'PER_UNIT_PER_KM',
                    'base_fee' => 400000,
                    'cost_per_km_unit' => 22000,
                    'min_charge' => 750000,
                    'notes' => 'Zona 3: Radius 25-60 Km di sekitar ' . $plant->name,
                    'is_active' => true,
                ]
            );
        }
    }
}
