<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Customer\Database\Seeders\CustomerDatabaseSeeder;
use Modules\DeliveryRate\Database\Seeders\DeliveryRateDatabaseSeeder;
use Modules\Product\Database\Seeders\ProductDatabaseSeeder;
use Modules\ProductCategory\Database\Seeders\ProductCategoryDatabaseSeeder;

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
        ]);
    }
}
