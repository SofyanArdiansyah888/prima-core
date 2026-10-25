<?php

namespace Tests\Feature;

use App\Models\User;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Enums\UserRole;
use Tests\TestCase;

class DriverDeliveryApiTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    private Branch $branch;
    private BatchingPlant $plant;
    private User $driver;
    private Customer $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::query()->create([
            'code' => 'BR-TEST-02',
            'name' => 'Cabang Test 2',
            'address' => 'Jl. Test',
            'is_active' => true,
        ]);

        $this->plant = BatchingPlant::query()->create([
            'branch_id' => $this->branch->id,
            'code' => 'BP-TEST-02',
            'name' => 'Plant Test 2',
            'lat' => -5.112,
            'lng' => 119.489,
            'is_active' => true,
        ]);

        $this->driver = User::query()->create([
            'name' => 'Pak Syamsuddin',
            'email' => 'sopir.test@pkm.test',
            'phone' => '081299990003',
            'password' => bcrypt('password'),
            'role' => UserRole::Driver,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->customer = Customer::query()->create([
            'name' => 'Pak Haji Andi',
            'phone' => '081399990002',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $cat = ProductCategory::query()->create([
            'code' => 'CAT-TEST-2',
            'name' => 'Ready Mix',
            'slug' => 'ready-mix-2',
        ]);

        $this->product = Product::query()->create([
            'category_id' => $cat->id,
            'code' => 'PROD-K250',
            'name' => 'Beton K-250',
            'unit' => 'm³',
            'price' => 800000,
            'is_active' => true,
        ]);
    }

    public function test_driver_can_login_with_phone_and_email(): void
    {
        $responsePhone = $this->postJson('/api/driver/v1/login', [
            'login' => '081299990003',
            'password' => 'password',
        ]);
        $responsePhone->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'role']]);

        $responseEmail = $this->postJson('/api/driver/v1/login', [
            'login' => 'sopir.test@pkm.test',
            'password' => 'password',
        ]);
        $responseEmail->assertOk();
    }

    public function test_driver_can_list_assigned_deliveries(): void
    {
        $token = $this->driver->createToken('test')->plainTextToken;

        $sj = SuratJalan::query()->create([
            'code' => 'SJ-TEST-001',
            'batching_plant_id' => $this->plant->id,
            'driver_id' => $this->driver->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Pak Syamsuddin',
            'driver_phone' => '081299990003',
            'status' => 'ON_THE_WAY',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/driver/v1/deliveries');

        $response->assertOk()
            ->assertJsonPath('data.0.code', 'SJ-TEST-001');
    }

    public function test_driver_completing_delivery_does_not_automatically_finish_order(): void
    {
        $token = $this->driver->createToken('test')->plainTextToken;

        $order = Order::query()->create([
            'customer_id' => $this->customer->id,
            'code' => 'ORD-TEST-003',
            'customer_name' => 'Pak Haji Andi',
            'customer_phone' => '081399990002',
            'customer_type' => 'B2C',
            'project_title' => 'Dak Lantai 2',
            'batching_plant_id' => $this->plant->id,
            'delivery_address' => 'Jl. Pengayoman No 5',
            'status' => 'ON_DELIVERY',
            'total_price' => 5600000,
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PAID',
        ]);

        $orderItem = OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 7.0,
            'fulfilled_quantity' => 7.0, // fulfilled 100%
            'unit' => 'm³',
            'unit_price' => 800000,
            'subtotal' => 5600000,
        ]);

        $sj = SuratJalan::query()->create([
            'code' => 'SJ-TEST-002',
            'batching_plant_id' => $this->plant->id,
            'driver_id' => $this->driver->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Pak Syamsuddin',
            'driver_phone' => '081299990003',
            'status' => 'ON_THE_WAY',
        ]);

        $sjItem = SuratJalanItem::query()->create([
            'surat_jalan_id' => $sj->id,
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity_delivered' => 7.0,
            'unit' => 'm³',
            'destination_customer_name' => 'Pak Haji Andi',
            'destination_address' => 'Jl. Pengayoman No 5',
            'status' => 'ON_TRUCK',
        ]);

        // Driver completes delivery
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/driver/v1/deliveries/{$sj->uuid}/complete", [
                'recipient_name' => 'Pak Mandor Rustam',
                'notes' => 'Pengecoran dak lantai 2 selesai.',
            ]);

        $response->assertOk();

        // 1. Surat Jalan MUST be COMPLETED
        $this->assertDatabaseHas('surat_jalans', [
            'id' => $sj->id,
            'status' => 'COMPLETED',
        ]);

        // 2. Surat Jalan Item MUST be DELIVERED with recipient
        $this->assertDatabaseHas('surat_jalan_items', [
            'id' => $sjItem->id,
            'status' => 'DELIVERED',
            'recipient_name' => 'Pak Mandor Rustam',
        ]);

        // 3. CRITICAL: Order status MUST REMAIN ON_DELIVERY (NOT automatically COMPLETED)!
        $refreshedOrder = $order->fresh();
        $this->assertSame('ON_DELIVERY', $refreshedOrder->status);
        $this->assertNotNull($refreshedOrder->delivered_at);
        $this->assertNull($refreshedOrder->customer_confirmed_at);
    }
}
