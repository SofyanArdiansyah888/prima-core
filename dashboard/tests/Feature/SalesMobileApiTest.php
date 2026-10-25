<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Enums\UserRole;
use Tests\TestCase;

class SalesMobileApiTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;
    private BatchingPlant $plant;
    private User $sales;
    private User $driver;
    private Customer $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::query()->create([
            'code' => 'BR-TEST-01',
            'name' => 'Cabang Test',
            'address' => 'Jl. Test',
            'is_active' => true,
        ]);

        $this->plant = BatchingPlant::query()->create([
            'branch_id' => $this->branch->id,
            'code' => 'BP-TEST-01',
            'name' => 'Plant Test',
            'lat' => -5.112,
            'lng' => 119.489,
            'is_active' => true,
        ]);

        $this->sales = User::query()->create([
            'name' => 'Sales Budi',
            'email' => 'sales.test@pkm.test',
            'phone' => '081299990001',
            'password' => bcrypt('password'),
            'role' => UserRole::Sales,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);
        $this->sales->batchingPlants()->attach($this->plant->id);

        $this->driver = User::query()->create([
            'name' => 'Supir Syam',
            'email' => 'driver.test@pkm.test',
            'phone' => '081299990002',
            'password' => bcrypt('password'),
            'role' => UserRole::Driver,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->customer = Customer::query()->create([
            'name' => 'Pelanggan Proyek',
            'phone' => '081399990001',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $cat = ProductCategory::query()->create([
            'code' => 'CAT-TEST',
            'name' => 'Ready Mix',
            'slug' => 'ready-mix',
        ]);

        $this->product = Product::query()->create([
            'category_id' => $cat->id,
            'code' => 'PROD-K300',
            'name' => 'Beton K-300',
            'unit' => 'm³',
            'price' => 850000,
            'is_active' => true,
        ]);
    }

    public function test_sales_can_login_with_phone_and_email(): void
    {
        // Login with phone
        $responsePhone = $this->postJson('/api/sales/v1/login', [
            'login' => '081299990001',
            'password' => 'password',
        ]);
        $responsePhone->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'role']]);

        // Login with email
        $responseEmail = $this->postJson('/api/sales/v1/login', [
            'login' => 'sales.test@pkm.test',
            'password' => 'password',
        ]);
        $responseEmail->assertOk();
    }

    public function test_driver_or_invalid_role_cannot_login_to_sales_api(): void
    {
        $response = $this->postJson('/api/sales/v1/login', [
            'login' => 'driver.test@pkm.test',
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['login']);
    }

    public function test_sales_can_approve_order_and_recalculate_position(): void
    {
        $token = $this->sales->createToken('test')->plainTextToken;

        $order = Order::query()->create([
            'customer_id' => $this->customer->id,
            'code' => 'ORD-TEST-001',
            'customer_name' => 'Pelanggan Proyek',
            'customer_phone' => '081399990001',
            'customer_type' => 'B2C',
            'project_title' => 'Pengecoran Rumah Tinggal',
            'batching_plant_id' => $this->plant->id,
            'delivery_address' => 'Jl. Gang Sempit No 1',
            'delivery_lat' => -5.115,
            'delivery_lng' => 119.495,
            'distance_km' => 2.5,
            'subtotal' => 8500000,
            'delivery_fee' => 250000,
            'admin_fee' => 5000,
            'ppn' => 935000,
            'total_price' => 9690000,
            'status' => 'PENDING_APPROVAL',
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PENDING',
        ]);

        // Approve with adjusted road access pin
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/sales/v1/orders/{$order->uuid}/approve", [
                'delivery_lat' => -5.118,
                'delivery_lng' => 119.499,
                'delivery_address' => 'Jl. Poros Utama Depan Gapura Gang Sempit',
                'survey_notes' => 'Akses gang tidak muat truk mixer 7m3. Truk parkir di bibir jalan poros.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'CONFIRMED')
            ->assertJsonPath('data.delivery_address', 'Jl. Poros Utama Depan Gapura Gang Sempit')
            ->assertJsonPath('data.survey_notes', 'Akses gang tidak muat truk mixer 7m3. Truk parkir di bibir jalan poros.');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'CONFIRMED',
            'approved_by_id' => $this->sales->id,
        ]);
    }

    public function test_sales_can_reject_order_with_reason(): void
    {
        $token = $this->sales->createToken('test')->plainTextToken;

        $order = Order::query()->create([
            'customer_id' => $this->customer->id,
            'code' => 'ORD-TEST-002',
            'customer_name' => 'Pelanggan Proyek 2',
            'customer_phone' => '081399990001',
            'customer_type' => 'B2C',
            'project_title' => 'Pengecoran Ruko',
            'batching_plant_id' => $this->plant->id,
            'delivery_address' => 'Pulau terisolir',
            'status' => 'PENDING_APPROVAL',
            'total_price' => 5000000,
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PENDING',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/sales/v1/orders/{$order->uuid}/reject", [
                'rejection_reason' => 'Jembatan menuju lokasi roboh dan tidak ada akses darat alternatif untuk truk tronton.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED')
            ->assertJsonPath('data.rejection_reason', 'Jembatan menuju lokasi roboh dan tidak ada akses darat alternatif untuk truk tronton.');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'CANCELLED',
        ]);
    }
}
