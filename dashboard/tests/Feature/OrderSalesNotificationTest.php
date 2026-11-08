<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\Shared\Jobs\SendWhatsappMessage;
use Tests\TestCase;

class OrderSalesNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Product $cement;

    private BatchingPlant $plant;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plant = BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01',
            'branch_id' => $this->branch->id,
            'name' => 'Batching Plant Pangkep',
            'lat' => -4.783,
            'lng' => 119.557,
            'status' => 'OPERATIONAL',
            'is_active' => true,
        ]);
        $this->cement = Product::query()->create([
            'code' => 'ST-OPC-50KG',
            'name' => 'Semen Tonasa OPC',
            'category' => 'cement',
            'unit' => 'Sak',
            'base_price' => 78000,
            'min_order' => 20,
            'is_active' => true,
        ]);
    }

    private function makeSales(string $email, string $phone, bool $assigned): User
    {
        $user = User::query()->create([
            'name' => 'Sales '.$email,
            'email' => $email,
            'phone' => $phone,
            'password' => bcrypt('password'),
            'role' => UserRole::Sales,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);
        if ($assigned) {
            $user->batchingPlants()->attach($this->plant->id);
        }

        return $user;
    }

    private function placeOrder(): TestResponse
    {
        $token = Customer::query()->create([
            'name' => 'Pelanggan',
            'phone' => '081300000099',
            'password' => 'password',
            'is_active' => true,
        ])->createToken('mobile')->plainTextToken;

        return $this->withToken($token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Gudang Semen',
            'delivery_address' => 'Jl. Poros Tonasa II No. 10',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS',
            'items' => [['product_uuid' => $this->cement->uuid, 'quantity' => 25]],
        ]);
    }

    public function test_new_order_notifies_sales_assigned_to_plant_via_whatsapp(): void
    {
        Queue::fake();
        $this->makeSales('assigned@pkm.test', '081299990001', assigned: true);
        $this->makeSales('other@pkm.test', '081299990002', assigned: false);

        $res = $this->placeOrder()->assertCreated();

        Queue::assertPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '081299990001'
            && str_contains($job->message, $res->json('data.code'))
            && str_contains($job->message, 'PERLU SURVEI LOKASI')
            && str_contains($job->message, 'Semen Tonasa OPC — 25 Sak')
            && str_contains($job->message, 'google.com/maps/search/?api=1&query=')
            && str_contains($job->message, '/sales/orders/'));
        Queue::assertNotPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '081299990002');
        // Pesan customer tidak boleh memuat harga sebelum di-ACC
        Queue::assertNotPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '081300000099'
            && str_contains($job->message, 'Rp'));

        $res->assertJsonPath('data.sales_contacts.0.whatsapp', '6281299990001');
        $this->assertCount(1, $res->json('data.sales_contacts'));
    }

    public function test_falls_back_to_branch_sales_when_none_assigned(): void
    {
        Queue::fake();
        $this->makeSales('branch@pkm.test', '081299990003', assigned: false);

        $this->placeOrder()->assertCreated()
            ->assertJsonPath('data.sales_contacts.0.whatsapp', '6281299990003');

        Queue::assertPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '081299990003');
    }
}
