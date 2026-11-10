<?php

namespace Modules\Customer\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Customer\Models\Customer;

class CustomerDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['081300000001', 'Pelanggan Demo', 'pelanggan@pkm.test'],
            ['081300000002', 'Andi Pratama', 'andi@pkm.test'],
            ['081300000003', 'CV Bangun Jaya', 'bangunjaya@pkm.test'],
            ['081300000004', 'Siti Rahmawati', null],
        ];

        foreach ($customers as [$phone, $name, $email]) {
            Customer::query()->updateOrCreate(
                ['phone' => $phone],
                [
                    'name' => $name,
                    'email' => $email,
                    'password' => 'password',
                    'is_active' => true,
                ],
            );
        }
    }
}
