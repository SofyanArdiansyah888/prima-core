<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Order\Services\MidtransPaymentService;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Tests\TestCase;

/**
 * Concrete Pump (CP) saat checkout, jarak manual sales saat ACC, dan pembayaran tunai lapangan.
 */
class SalesFieldFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private BatchingPlant $plant;

    private Product $mix;

    private Product $cement;

    private Customer $customer;

    private User $admin;

    private User $sales;

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
            'status' => 'OPERATIONAL',
            'is_active' => true,
            'concrete_pump_fee' => 2500000,
        ]);

        $this->mix = Product::query()->create([
            'code' => 'RM-K300',
            'name' => 'Ready Mix Beton Mutu K-300',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 1000000,
            'min_order' => 1,
            'is_active' => true,
        ]);

        $this->cement = Product::query()->create([
            'code' => 'SMN-PCC',
            'name' => 'Semen PCC 50kg',
            'category' => 'cement',
            'unit' => 'sak',
            'base_price' => 70000,
            'min_order' => 10,
            'is_active' => true,
        ]);

        $this->customer = Customer::query()->create([
            'name' => 'H. Syamsuddin',
            'phone' => '081300000001',
            'password' => 'password',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create(['role' => UserRole::Admin, 'branch_id' => $branch->id]);
        $this->sales = User::factory()->create(['role' => UserRole::Sales, 'branch_id' => $branch->id]);
        $this->sales->batchingPlants()->attach($this->plant->id);
    }

    private function placeOrder(bool $pump = false, ?Product $product = null, float $qty = 10): Order
    {
        $token = $this->customer->createToken('mobile')->plainTextToken;

        $uuid = $this->withToken($token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Dak Lantai 2',
            'delivery_address' => 'Jl. Poros Tonasa II',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS',
            'use_concrete_pump' => $pump,
            'items' => [['product_uuid' => ($product ?? $this->mix)->uuid, 'quantity' => $qty]],
        ])->assertCreated()->json('data.uuid');

        $this->app['auth']->forgetGuards();

        return Order::query()->where('uuid', $uuid)->firstOrFail();
    }

    public function test_quote_reports_concrete_pump_availability_for_readymix_only(): void
    {
        $token = $this->customer->createToken('mobile')->plainTextToken;

        $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'items' => [['product_uuid' => $this->mix->uuid, 'quantity' => 5]],
        ])->assertOk()
            ->assertJsonPath('data.concrete_pump_available', true)
            ->assertJsonPath('data.concrete_pump_rate', 2500000);

        $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'items' => [['product_uuid' => $this->cement->uuid, 'quantity' => 20]],
        ])->assertOk()->assertJsonPath('data.concrete_pump_available', false);

        $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'use_concrete_pump' => true,
            'items' => [['product_uuid' => $this->cement->uuid, 'quantity' => 20]],
        ])->assertStatus(422)->assertJsonValidationErrors('use_concrete_pump');
    }

    public function test_order_with_concrete_pump_adds_fee_to_taxable_total_and_midtrans_items(): void
    {
        $order = $this->placeOrder(pump: true);

        $this->assertTrue($order->uses_concrete_pump);
        $this->assertEquals(2500000, (float) $order->concrete_pump_fee);

        $expectedPpn = round(((float) $order->subtotal + (float) $order->delivery_fee + 2500000) * 0.11, 2);
        $this->assertEquals($expectedPpn, (float) $order->ppn);
        $this->assertEquals(
            round((float) $order->subtotal + (float) $order->delivery_fee + 2500000 + $expectedPpn + (float) $order->admin_fee, 2),
            (float) $order->total_price,
        );

        $without = $this->placeOrder(pump: false);
        $this->assertFalse($without->uses_concrete_pump);
        $this->assertEquals(0, (float) $without->concrete_pump_fee);
    }

    public function test_sales_manual_distance_recalculates_delivery_fee_and_keeps_gps_distance(): void
    {
        $order = $this->placeOrder();
        $gpsKm = (float) $order->distance_km;
        $this->assertEquals($gpsKm, (float) $order->gps_distance_km);

        $token = $this->sales->createToken('sales')->plainTextToken;
        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve", [
            'distance_km' => 12.5,
        ])->assertOk()
            ->assertJsonPath('data.is_distance_manual', true)
            ->assertJsonPath('data.distance_km', 12.5);

        $order->refresh();
        $this->assertSame('CONFIRMED', $order->status);
        $this->assertTrue($order->is_distance_manual);
        $this->assertEquals(12.5, (float) $order->distance_km);
        $this->assertEquals($gpsKm, (float) $order->gps_distance_km);
        // Tarif fallback (tanpa tabel tarif): km × 15.000 × volume, dibulatkan ribuan.
        $this->assertEquals(round(12.5 * 15000 * 10, -3), (float) $order->delivery_fee);
        $this->assertEquals(
            round(((float) $order->subtotal + (float) $order->delivery_fee) * 0.11, 2),
            (float) $order->ppn,
        );
    }

    public function test_sales_can_toggle_concrete_pump_during_survey(): void
    {
        $order = $this->placeOrder(pump: false);
        $token = $this->sales->createToken('sales')->plainTextToken;

        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve", [
            'uses_concrete_pump' => true,
        ])->assertOk()->assertJsonPath('data.uses_concrete_pump', true);

        $order->refresh();
        $this->assertEquals(2500000, (float) $order->concrete_pump_fee);
        $this->assertEquals(
            round(((float) $order->subtotal + (float) $order->delivery_fee + 2500000) * 0.11, 2),
            (float) $order->ppn,
        );
    }

    public function test_manual_distance_validation_rejects_out_of_range_values(): void
    {
        $order = $this->placeOrder();
        $token = $this->sales->createToken('sales')->plainTextToken;

        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve", ['distance_km' => 0])
            ->assertStatus(422)->assertJsonValidationErrors('distance_km');
        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve", ['distance_km' => 900])
            ->assertStatus(422)->assertJsonValidationErrors('distance_km');
    }

    public function test_cash_payment_flow_requires_dashboard_verification(): void
    {
        Storage::fake('public');
        $order = $this->placeOrder();
        $salesToken = $this->sales->createToken('sales')->plainTextToken;

        // Belum di-ACC → belum boleh dicatat
        $this->withToken($salesToken)->post("/api/sales/v1/orders/{$order->uuid}/cash-payment", [
            'amount' => (float) $order->total_price,
            'photo' => UploadedFile::fake()->image('kuitansi.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        $this->withToken($salesToken)->postJson("/api/sales/v1/orders/{$order->uuid}/approve")->assertOk();
        $order->refresh();

        // Nominal tidak sama dengan tagihan → ditolak
        $this->withToken($salesToken)->post("/api/sales/v1/orders/{$order->uuid}/cash-payment", [
            'amount' => 1000,
            'photo' => UploadedFile::fake()->image('kuitansi.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('amount');

        $this->withToken($salesToken)->post("/api/sales/v1/orders/{$order->uuid}/cash-payment", [
            'amount' => (float) $order->total_price,
            'photo' => UploadedFile::fake()->image('kuitansi.jpg'),
            'notes' => 'Diterima mandor',
        ], ['Accept' => 'application/json'])->assertOk()
            ->assertJsonPath('data.cash_payment.status', 'PENDING_VERIFICATION')
            ->assertJsonPath('data.payment_method', 'CASH');

        $order->refresh();
        $this->assertSame('PENDING', $order->payment_status);
        $this->assertTrue($order->hasPendingCashPayment());
        Storage::disk('public')->assertExists($order->cash_payment_proof_path);

        // Customer tidak bisa bayar Midtrans selama tunai menunggu verifikasi
        $this->app['auth']->forgetGuards();
        $customerToken = $this->customer->createToken('mobile')->plainTextToken;
        $this->withToken($customerToken)->getJson("/api/customer/v1/orders/{$order->uuid}")
            ->assertJsonPath('data.can_pay', false)
            ->assertJsonPath('data.cash_payment_pending', true);

        // Operator biasa tidak boleh memverifikasi
        $operator = User::factory()->create(['role' => UserRole::User, 'has_full_plant_access' => true]);
        $this->actingAs($operator)->post(route('orders.cash-payment.verify', $order))->assertForbidden();

        // Keuangan memverifikasi → lunas
        $finance = User::factory()->create(['role' => UserRole::Keuangan, 'has_full_plant_access' => true]);
        $this->actingAs($finance)->post(route('orders.cash-payment.verify', $order))->assertRedirect();

        $order->refresh();
        $this->assertSame('PAID', $order->payment_status);
        $this->assertNotNull($order->paid_at);
        $this->assertSame($finance->id, $order->cash_verified_by_id);
    }

    public function test_rejected_cash_payment_returns_order_to_online_payment(): void
    {
        Storage::fake('public');
        $order = $this->placeOrder();
        $salesToken = $this->sales->createToken('sales')->plainTextToken;
        $this->withToken($salesToken)->postJson("/api/sales/v1/orders/{$order->uuid}/approve")->assertOk();
        $order->refresh();

        $this->withToken($salesToken)->post("/api/sales/v1/orders/{$order->uuid}/cash-payment", [
            'amount' => (float) $order->total_price,
            'photo' => UploadedFile::fake()->image('kuitansi.jpg'),
        ], ['Accept' => 'application/json'])->assertOk();

        $this->actingAs($this->admin)->post(route('orders.cash-payment.reject', $order), ['reason' => 'Kuitansi buram'])
            ->assertRedirect();

        $order->refresh();
        $this->assertSame('PENDING', $order->payment_status);
        $this->assertSame('MIDTRANS', $order->payment_method);
        $this->assertSame('Kuitansi buram', $order->cash_rejection_reason);
        $this->assertFalse($order->hasPendingCashPayment());
    }

    public function test_midtrans_item_details_include_concrete_pump_line(): void
    {
        $order = $this->placeOrder(pump: true);
        $order->update(['status' => 'CONFIRMED']);

        config(['services.midtrans.server_key' => '']);
        $result = app(MidtransPaymentService::class)->createSnapTransaction($order->fresh(), true);

        $this->assertNotEmpty($result['token']);
    }
}
