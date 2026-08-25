<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Shared\Enums\PlantStatus;
use Modules\Shared\Enums\UserRole;
use Modules\Shared\Models\DocumentSequence;
use Modules\Shared\Services\CodeGenerator;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $codes = app(CodeGenerator::class);

        DocumentSequence::query()->updateOrCreate(
            ['entity' => 'branch', 'scope' => 'SULSEL', 'year' => null],
            ['last_number' => 1],
        );

        $branch = Branch::query()->updateOrCreate(
            ['code' => 'BR-SULSEL-01'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Cabang Sulawesi Selatan',
                'address' => 'Kawasan Industri Semen Tonasa & Makassar',
                'phone' => '(0410) 21012',
                'is_active' => true,
            ],
        );

        DocumentSequence::query()->updateOrCreate(
            ['entity' => 'batching_plant', 'scope' => 'BR-SULSEL-01', 'year' => null],
            ['last_number' => 3],
        );

        $plants = [
            [
                'code' => 'BR-SULSEL-01-BP-01',
                'name' => 'Batching Plant Utama - Pangkep',
                'address' => 'Kawasan Pabrik Semen Tonasa, Biringere, Pangkep',
                'phone' => '(0410) 21012',
                'lat' => -4.792,
                'lng' => 119.554,
                'daily_capacity_m3' => 1200,
            ],
            [
                'code' => 'BR-SULSEL-01-BP-02',
                'name' => 'Batching Plant Cabang Makassar (KIMA)',
                'address' => 'Kawasan Industri Makassar (KIMA) III, Makassar',
                'phone' => '(0411) 472190',
                'lat' => -5.112,
                'lng' => 119.489,
                'daily_capacity_m3' => 950,
            ],
            [
                'code' => 'BR-SULSEL-01-BP-03',
                'name' => 'Batching Plant Support - Maros',
                'address' => 'Jl. Poros Maros - Pangkep Km 8, Lau, Maros',
                'phone' => '(0411) 381022',
                'lat' => -4.981,
                'lng' => 119.578,
                'daily_capacity_m3' => 600,
            ],
        ];

        $plantModels = [];
        foreach ($plants as $plant) {
            $plantModels[] = BatchingPlant::query()->updateOrCreate(
                ['code' => $plant['code']],
                [
                    'uuid' => (string) Str::uuid(),
                    'branch_id' => $branch->id,
                    'name' => $plant['name'],
                    'address' => $plant['address'],
                    'phone' => $plant['phone'],
                    'lat' => $plant['lat'],
                    'lng' => $plant['lng'],
                    'daily_capacity_m3' => $plant['daily_capacity_m3'],
                    'status' => PlantStatus::Operational,
                    'is_active' => true,
                ],
            );
        }

        $year = (int) date('Y');
        DocumentSequence::query()->updateOrCreate(
            ['entity' => 'employee', 'scope' => 'HQ', 'year' => $year],
            ['last_number' => 1],
        );
        DocumentSequence::query()->updateOrCreate(
            ['entity' => 'employee', 'scope' => 'SULSEL', 'year' => $year],
            ['last_number' => 1],
        );

        $adminCode = sprintf('EMP-HQ-%d00001', $year);
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@pkm.test'],
            [
                'uuid' => (string) Str::uuid(),
                'code' => $adminCode,
                'name' => 'Admin PKM',
                'password' => Hash::make('password'),
                'role' => UserRole::Admin,
                'branch_id' => null,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $userCode = sprintf('EMP-SULSEL-%d00001', $year);
        $operator = User::query()->updateOrCreate(
            ['email' => 'operator@pkm.test'],
            [
                'uuid' => (string) Str::uuid(),
                'code' => $userCode,
                'name' => 'Operator Pangkep',
                'password' => Hash::make('password'),
                'role' => UserRole::User,
                'branch_id' => $branch->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $operator->batchingPlants()->sync([$plantModels[0]->id, $plantModels[1]->id]);

        unset($codes, $admin);
    }
}
