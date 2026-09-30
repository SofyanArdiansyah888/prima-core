<?php

namespace Modules\Customer\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Customer\Models\Customer;

class CustomerDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Customer::query()->updateOrCreate(
            ['phone' => '081300000001'],
            [
                'name' => 'Pelanggan Demo',
                'email' => 'pelanggan@pkm.test',
                'password' => 'password',
                'is_active' => true,
            ],
        );
    }
}
