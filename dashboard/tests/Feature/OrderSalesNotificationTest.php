<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Product\Models\Product;
use Modules\Shared\Jobs\SendWhatsappMessage;
use Tests\TestCase;

class OrderSalesNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Product $cement;

    private BatchingPlant $plant;

    protected function setUp(): void
    {
        parent::setUp();

        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plant = BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01',
            'branch_id' => $branch->id,
            'name' => 'Batching Plant Pangkep',
            'lat' => -4.783,
            'lng' => 119.557,
            'whatsapp' => '6281299990001',
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

    private function placeOrder(int $quantity = 250): TestResponse
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
            'items' => [['product_uuid' => $this->cement->uuid, 'quantity' => $quantity]],
        ]);
    }

    public function test_new_order_notifies_plant_whatsapp_as_sales_number(): void
    {
        Queue::fake();

        $res = $this->placeOrder()->assertCreated();

        Queue::assertPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '6281299990001'
            && str_contains($job->message, $res->json('data.code'))
            && str_contains($job->message, 'PERLU SURVEI LOKASI')
            && str_contains($job->message, 'Halo Tim Sales *Batching Plant Pangkep*')
            && str_contains($job->message, 'Semen Tonasa OPC — 250 Sak')
            && str_contains($job->message, 'google.com/maps/search/?api=1&query=')
            && str_contains($job->message, '/sales/orders/'));
        // Pesan customer tidak boleh memuat harga sebelum di-ACC
        Queue::assertNotPushed(SendWhatsappMessage::class, fn ($job) => $job->phone === '081300000099'
            && str_contains($job->message, 'Rp'));

        $res->assertJsonPath('data.sales_contacts.0.whatsapp', '6281299990001')
            ->assertJsonPath('data.sales_contacts.0.name', 'Sales Batching Plant Pangkep');
    }

    public function test_no_sales_notification_when_plant_has_no_whatsapp(): void
    {
        Queue::fake();
        $this->plant->update(['whatsapp' => null]);

        $this->placeOrder()->assertCreated()->assertJsonPath('data.sales_contacts', []);

        Queue::assertNotPushed(SendWhatsappMessage::class, fn ($job) => str_contains($job->message, 'PERLU SURVEI LOKASI'));
    }
}
