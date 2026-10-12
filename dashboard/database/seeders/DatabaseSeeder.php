<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Customer\Database\Seeders\CustomerDatabaseSeeder;
use Modules\DeliveryRate\Database\Seeders\DeliveryRateDatabaseSeeder;
use Modules\Dispatch\Database\Seeders\DispatchDatabaseSeeder;
use Modules\Order\Database\Seeders\OrderDatabaseSeeder;
use Modules\Product\Database\Seeders\ProductDatabaseSeeder;
use Modules\ProductCategory\Database\Seeders\ProductCategoryDatabaseSeeder;
use Modules\WorkOrder\Database\Seeders\WorkOrderDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            MasterDataSeeder::class,
            ProductCategoryDatabaseSeeder::class,
            ProductDatabaseSeeder::class,
            CustomerDatabaseSeeder::class,
            DeliveryRateDatabaseSeeder::class,
            OrderDatabaseSeeder::class,
            WorkOrderDatabaseSeeder::class,
            DispatchDatabaseSeeder::class,
        ]);
    }
}
