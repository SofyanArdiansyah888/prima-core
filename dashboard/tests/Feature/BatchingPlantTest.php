<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Tests\TestCase;

class BatchingPlantTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_batching_plant_without_reproviding_branch_id(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $branch = Branch::query()->firstOrCreate(
            ['code' => 'SULSEL'],
            ['name' => 'Cabang Sulawesi Selatan', 'is_active' => true]
        );

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'SULSEL-BP-99',
            'name' => 'Plant Test Asli',
            'address' => 'Jl. Urip Sumoharjo',
            'phone' => '0811223344',
            'status' => 'OPERATIONAL',
            'is_active' => true,
        ]);

        // Simulating the browser form submit where disabled branch_id select is omitted or sent via hidden input
        $response = $this->actingAs($admin)->put("/master/batching-plants/{$plant->uuid}", [
            'name' => 'Plant Test Diperbarui',
            'address' => 'Jl. Perintis Kemerdekaan',
            'phone' => '0899887766',
            'status' => 'OPERATIONAL',
            'is_active' => true,
        ]);

        $response->assertRedirect('/master/batching-plants');
        $plant->refresh();
        $this->assertEquals('Plant Test Diperbarui', $plant->name);
        $this->assertEquals($branch->id, $plant->branch_id);
    }
}
