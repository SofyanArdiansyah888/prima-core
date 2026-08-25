<?php

namespace Modules\WorkOrder\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;

class WorkOrderDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $plantPangkep = BatchingPlant::where('code', 'like', '%BP-01%')->first() ?? BatchingPlant::first();
        $plantMakassar = BatchingPlant::where('code', 'like', '%BP-02%')->first() ?? BatchingPlant::first();
        $operator = User::where('role', 'user')->first() ?? User::first();

        $order1 = Order::where('code', 'SO-SULSEL-2026080001')->first();
        $order2 = Order::where('code', 'SO-SULSEL-2026080002')->first();
        $prodK300 = Product::where('code', 'RM-K300')->first();
        $prodBulk = Product::where('code', 'ST-BULK-300T')->first();

        if ($order1 && $plantPangkep && $prodK300) {
            WorkOrder::query()->updateOrCreate(
                ['code' => 'WO-BP01-2026080001'],
                [
                    'order_id' => $order1->id,
                    'product_id' => $prodK300->id,
                    'batching_plant_id' => $plantPangkep->id,
                    'assigned_user_id' => $operator?->id,
                    'scheduled_date' => now()->toDateString(),
                    'scheduled_time_slot' => '09:00 - 13:00 WITA',
                    'target_quantity' => 21.00,
                    'produced_quantity' => 14.00,
                    'dispatched_quantity' => 7.00,
                    'unit' => 'm³',
                    'status' => 'IN_PRODUCTION',
                    'batch_recipe_code' => 'MIX-K300-TONASA-PCC',
                    'slump_target' => '12 ± 2 cm',
                    'production_notes' => 'Pengecoran dak lantai 2. Mixer #04 telah berangkat ritase ke-1.',
                ]
            );
        }

        if ($order2 && $plantMakassar && $prodBulk) {
            WorkOrder::query()->updateOrCreate(
                ['code' => 'WO-BP02-2026080001'],
                [
                    'order_id' => $order2->id,
                    'product_id' => $prodBulk->id,
                    'batching_plant_id' => $plantMakassar->id,
                    'assigned_user_id' => $operator?->id,
                    'scheduled_date' => now()->toDateString(),
                    'scheduled_time_slot' => '08:00 - 17:00 WITA',
                    'target_quantity' => 500.00,
                    'produced_quantity' => 300.00,
                    'dispatched_quantity' => 300.00,
                    'unit' => 'Ton',
                    'status' => 'IN_PRODUCTION',
                    'batch_recipe_code' => 'BULK-OPC-I-MNP',
                    'slump_target' => 'N/A (Curah)',
                    'production_notes' => 'Pengiriman multi-trip semen curah 500 Ton. Ritase 1 (300T) selesai, Ritase 2 (200T) dijadwalkan sore.',
                ]
            );
        }
    }
}
