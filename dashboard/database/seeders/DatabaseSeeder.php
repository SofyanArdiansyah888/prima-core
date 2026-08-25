<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            MasterDataSeeder::class,
            \Modules\Product\Database\Seeders\ProductDatabaseSeeder::class,
            \Modules\DeliveryRate\Database\Seeders\DeliveryRateDatabaseSeeder::class,
            \Modules\Order\Database\Seeders\OrderDatabaseSeeder::class,
            \Modules\WorkOrder\Database\Seeders\WorkOrderDatabaseSeeder::class,
            \Modules\Dispatch\Database\Seeders\DispatchDatabaseSeeder::class,
        ]);
    }
}
