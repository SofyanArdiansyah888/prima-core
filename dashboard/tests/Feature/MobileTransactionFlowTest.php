<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Order\Models\Order;
use Modules\Order\Services\MidtransPaymentService;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

/**
 * Alur transaksi end-to-end mobile (pelanggan, sales, supir) + dashboard (SPK, SJ).
 */
class MobileTransactionFlowTest extends TestCase
{
    use RefreshDatabase;

    private BatchingPlant $plant;

    private Product $mix;

    private Customer $customer;

    private User $admin;

    private User $sales;

    private User $driver;

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
        ]);

        $this->mix = Product::query()->create([
            'code' => 'RM-K300',
            'name' => 'Ready Mix Beton Mutu K-300',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 890000,
            'min_order' => 3,
            'is_active' => true,
        ]);

        $this->customer = Customer::query()->create([
            'name' => 'H. Syamsuddin',
            'phone' => '081300000001',
            'password' => 'password',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create(['role' => UserRole::Admin, 'branch_id' => $branch->id]);

        $this->sales = User::factory()->create([
            'role' => UserRole::Sales,
            'branch_id' => $branch->id,
            'phone' => '081241129902',
        ]);

        $this->driver = User::factory()->create([
            'role' => UserRole::Driver,
            'branch_id' => $branch->id,
            'phone' => '081241129901',
        ]);
    }

    public function test_full_transaction_flow_from_mobile_checkout_to_customer_confirmation(): void
    {
        $customerToken = $this->customer->createToken('mobile')->plainTextToken;

        // 1. Pelanggan checkout → PENDING_APPROVAL
        $uuid = $this->withToken($customerToken)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Dak Lantai 2',
            'delivery_address' => 'Jl. Poros Tonasa II',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS',
            'items' => [['product_uuid' => $this->mix->uuid, 'quantity' => 7]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'PENDING_APPROVAL')
            ->assertJsonPath('data.can_pay', false)
            ->json('data.uuid');

        $order = Order::query()->where('uuid', $uuid)->firstOrFail();
        $originalFee = (float) $order->delivery_fee;

        // 2. Sales melihat antrian & ACC dengan pin digeser lebih jauh → ongkir dihitung ulang
        $salesToken = $this->sales->createToken('sales')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($salesToken)->getJson('/api/sales/v1/orders?tab=pending')
            ->assertOk()
            ->assertJsonPath('data.0.uuid', $uuid);

        $this->app['auth']->forgetGuards();
        $approve = $this->withToken($salesToken)->postJson("/api/sales/v1/orders/{$uuid}/approve", [
            'delivery_lat' => -4.86,
            'delivery_lng' => 119.60,
            'delivery_address' => 'Jl. Poros, depan gapura',
            'survey_notes' => 'Gang sempit, truk parkir di jalan poros.',
        ])->assertOk()->assertJsonPath('data.status', 'CONFIRMED');

        $order->refresh();
        $this->assertGreaterThan($originalFee, (float) $order->delivery_fee);
        $this->assertEquals(round(((float) $order->subtotal + (float) $order->delivery_fee) * 0.11, 2), (float) $order->ppn);
        $this->assertEquals(
            round((float) $order->subtotal + (float) $order->delivery_fee + (float) $order->ppn + (float) $order->admin_fee, 2),
            (float) $order->total_price,
        );
        $this->assertEquals((float) $order->total_price, $approve->json('data.total_price'));

        // 3. Pelanggan bayar (Midtrans mock) lalu lunas
        $this->app['auth']->forgetGuards();
        $this->withToken($customerToken)->getJson("/api/customer/v1/orders/{$uuid}")
            ->assertOk()->assertJsonPath('data.can_pay', true);
        $this->withToken($customerToken)->postJson("/api/customer/v1/orders/{$uuid}/pay")->assertOk();
        $order->update(['payment_status' => 'PAID', 'paid_at' => now()]);
        $this->withToken($customerToken)->postJson("/api/customer/v1/orders/{$uuid}/pay")->assertStatus(422);

        // 4. Dashboard: SPK → PROCESSING
        $this->app['auth']->forgetGuards();
        $this->actingAs($this->admin)->post(route('work-orders.store'), [
            'order_id' => $order->id,
            'product_id' => $this->mix->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7,
        ])->assertSessionHasNoErrors();
        $this->assertSame('PROCESSING', $order->fresh()->status);
        $workOrder = WorkOrder::query()->where('order_id', $order->id)->firstOrFail();

        // 5. Dashboard: SJ dengan supir terdaftar → ON_DELIVERY
        $this->post(route('surat-jalan.store'), [
            'batching_plant_id' => $this->plant->id,
            'driver_id' => $this->driver->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => $this->driver->name,
            'driver_phone' => '0812-4112-9901',
            'items' => [[
                'order_id' => $order->id,
                'work_order_id' => $workOrder->id,
                'product_id' => $this->mix->id,
                'quantity_delivered' => 7,
                'destination_customer_name' => $order->customer_name,
                'destination_address' => $order->delivery_address,
                'delivery_sequence' => 1,
            ]],
        ])->assertSessionHasNoErrors();
        $this->assertSame('ON_DELIVERY', $order->fresh()->status);
        $sj = SuratJalan::query()->firstOrFail();
        $this->assertSame($this->driver->id, $sj->driver_id);

        // Muatan sudah 100% di truk, tapi belum diterima → pelanggan belum boleh konfirmasi
        $this->app['auth']->forgetGuards();
        $this->withToken($customerToken)->getJson("/api/customer/v1/orders/{$uuid}")
            ->assertJsonPath('data.can_confirm_complete', false);
        $this->withToken($customerToken)->postJson("/api/customer/v1/orders/{$uuid}/confirm-complete")
            ->assertStatus(422);

        // 6. Supir melihat SJ (via driver_id walau format HP beda) & e-POD
        $driverToken = $this->driver->createToken('driver')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($driverToken)->getJson('/api/driver/v1/deliveries?tab=active')
            ->assertOk()->assertJsonPath('data.0.uuid', $sj->uuid);
        $this->withToken($driverToken)->postJson("/api/driver/v1/deliveries/{$sj->uuid}/complete", [
            'recipient_name' => 'Mandor Rustam',
        ])->assertOk()->assertJsonPath('data.status', 'COMPLETED');

        $order->refresh();
        $this->assertSame('ON_DELIVERY', $order->status);
        $this->assertNotNull($order->delivered_at);

        // 7. Pelanggan konfirmasi selesai
        $this->app['auth']->forgetGuards();
        $this->withToken($customerToken)->getJson("/api/customer/v1/orders/{$uuid}")
            ->assertJsonPath('data.can_confirm_complete', true);
        $this->withToken($customerToken)->postJson("/api/customer/v1/orders/{$uuid}/confirm-complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.completed_by', 'CUSTOMER');
    }

    public function test_dashboard_approval_also_recalculates_delivery_fee(): void
    {
        $order = $this->pendingOrder();

        $this->actingAs($this->admin)->post(route('orders.approve', $order), [
            'delivery_lat' => -4.86,
            'delivery_lng' => 119.60,
        ])->assertSessionHas('success');

        $order->refresh();
        $this->assertSame('CONFIRMED', $order->status);
        $this->assertGreaterThan(100000, (float) $order->delivery_fee);
        $this->assertGreaterThan(5.0, (float) $order->distance_km);
    }

    public function test_sales_cannot_approve_twice_or_reject_after_approval(): void
    {
        $order = $this->pendingOrder();
        $token = $this->sales->createToken('sales')->plainTextToken;

        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve")->assertOk();
        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/approve")->assertStatus(422);
        $this->withToken($token)->postJson("/api/sales/v1/orders/{$order->uuid}/reject", ['rejection_reason' => 'x'])->assertStatus(422);
        $this->assertSame('CONFIRMED', $order->fresh()->status);
    }

    public function test_customer_cannot_pay_cancelled_order(): void
    {
        $order = $this->pendingOrder(['status' => 'CANCELLED']);
        $token = $this->customer->createToken('mobile')->plainTextToken;

        $this->withToken($token)->postJson("/api/customer/v1/orders/{$order->uuid}/pay")->assertStatus(422);
    }

    public function test_driver_cannot_complete_cancelled_surat_jalan(): void
    {
        $order = $this->pendingOrder(['status' => 'ON_DELIVERY']);
        $sj = $this->suratJalan($order, 'CANCELLED');
        $token = $this->driver->createToken('driver')->plainTextToken;

        $this->withToken($token)->postJson("/api/driver/v1/deliveries/{$sj->uuid}/complete", [
            'recipient_name' => 'Mandor',
        ])->assertStatus(422);

        $this->assertSame('CANCELLED', $sj->fresh()->status);
        $this->assertNull($order->fresh()->delivered_at);
    }

    public function test_dashboard_cannot_reopen_final_surat_jalan(): void
    {
        $order = $this->pendingOrder(['status' => 'ON_DELIVERY']);
        $sj = $this->suratJalan($order, 'CANCELLED');

        $this->actingAs($this->admin)->put(route('surat-jalan.update-status', $sj), ['status' => 'COMPLETED'])
            ->assertSessionHas('error');

        $this->assertSame('CANCELLED', $sj->fresh()->status);
    }

    public function test_cancelling_surat_jalan_clears_delivered_marker(): void
    {
        $order = $this->pendingOrder(['status' => 'ON_DELIVERY']);
        $order->items()->update(['fulfilled_quantity' => 7]);
        $done = $this->suratJalan($order, 'ON_THE_WAY', 4);
        $second = $this->suratJalan($order, 'ON_THE_WAY', 3);

        $this->actingAs($this->admin);
        $this->put(route('surat-jalan.update-status', $done), ['status' => 'COMPLETED'])->assertSessionHas('success');
        $this->assertNull($order->fresh()->delivered_at, 'Masih ada ritase di jalan');

        $this->put(route('surat-jalan.update-status', $second), ['status' => 'COMPLETED'])->assertSessionHas('success');
        $this->assertNotNull($order->fresh()->delivered_at);
    }

    public function test_cancelling_one_trip_keeps_order_on_delivery_when_another_trip_completed(): void
    {
        $order = $this->pendingOrder(['status' => 'ON_DELIVERY']);
        $order->items()->update(['fulfilled_quantity' => 7]);
        $this->suratJalan($order, 'COMPLETED', 4);
        $second = $this->suratJalan($order, 'ON_THE_WAY', 3);

        $this->actingAs($this->admin)->put(route('surat-jalan.update-status', $second), ['status' => 'CANCELLED'])
            ->assertSessionHas('success');

        $order->refresh();
        $this->assertSame('ON_DELIVERY', $order->status);
        $this->assertEquals(4, (float) $order->items()->first()->fulfilled_quantity);
        $this->assertNull($order->delivered_at);
    }

    public function test_mobile_tokens_cannot_reach_internal_master_api(): void
    {
        $order = $this->pendingOrder();
        $customerToken = $this->customer->createToken('mobile')->plainTextToken;

        $this->withToken($customerToken)->deleteJson("/api/v1/orders/{$order->uuid}")->assertNotFound();
        $this->withToken($customerToken)->postJson('/api/v1/users', [])->assertNotFound();
        $this->withToken($customerToken)->getJson('/api/v1/branches')->assertNotFound();

        $this->assertSame('PENDING_APPROVAL', $order->fresh()->status);
    }

    public function test_spk_and_surat_jalan_require_paid_order(): void
    {
        $order = $this->pendingOrder(['status' => 'CONFIRMED', 'payment_status' => 'PENDING']);
        $this->actingAs($this->admin);

        $this->get(route('work-orders.create', ['order_id' => $order->id]))->assertSessionHas('error');
        $this->post(route('work-orders.store'), $this->spkPayload($order))->assertSessionHasErrors('order_id');
        $this->assertSame(0, WorkOrder::query()->count());
        $this->assertSame('CONFIRMED', $order->fresh()->status);

        $this->post(route('surat-jalan.store'), $this->sjPayload($order))->assertSessionHasErrors('items.0.order_id');
        $this->assertSame(0, SuratJalan::query()->count());

        $order->update(['payment_status' => 'PAID', 'paid_at' => now()]);
        $this->post(route('work-orders.store'), $this->spkPayload($order))->assertSessionHasNoErrors();
        $this->assertSame('PROCESSING', $order->fresh()->status);
        $this->post(route('surat-jalan.store'), $this->sjPayload($order))->assertSessionHasNoErrors();
        $this->assertSame('ON_DELIVERY', $order->fresh()->status);
    }

    public function test_customer_cannot_cancel_order(): void
    {
        $order = $this->pendingOrder(['status' => 'CONFIRMED']);
        $token = $this->customer->createToken('mobile')->plainTextToken;

        $this->withToken($token)->postJson("/api/customer/v1/orders/{$order->uuid}/cancel")->assertStatus(422);
        $this->assertSame('CONFIRMED', $order->fresh()->status);
    }

    public function test_only_admin_can_cancel_and_paid_order_requires_refund(): void
    {
        $order = $this->pendingOrder(['status' => 'PROCESSING', 'payment_status' => 'PAID', 'paid_at' => now()]);
        $spk = WorkOrder::query()->create([
            'order_id' => $order->id,
            'code' => 'WO-CANCEL-1',
            'product_id' => $this->mix->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7,
            'produced_quantity' => 0,
            'dispatched_quantity' => 0,
            'unit' => 'm³',
            'status' => 'SCHEDULED',
        ]);

        $this->actingAs($this->sales)->post(route('orders.cancel', $order), ['cancellation_reason' => 'x'])->assertForbidden();

        $this->actingAs($this->admin)
            ->put(route('orders.update', $order), ['status' => 'CANCELLED', 'payment_status' => 'PAID'])
            ->assertSessionHas('error');
        $this->delete(route('orders.destroy', $order))->assertSessionHas('error');
        $this->post(route('orders.cancel', $order), ['cancellation_reason' => 'Proyek ditunda'])
            ->assertSessionHasErrors('refund_amount');
        $this->assertSame('PROCESSING', $order->fresh()->status);

        $this->post(route('orders.cancel', $order), [
            'cancellation_reason' => 'Proyek ditunda',
            'refund_amount' => 7000000,
            'refund_reference' => 'TRF-001',
        ])->assertSessionHas('success');

        $order->refresh();
        $this->assertSame('CANCELLED', $order->status);
        $this->assertSame('REFUNDED', $order->payment_status);
        $this->assertEquals(7000000, (float) $order->refund_amount);
        $this->assertSame($this->admin->id, $order->refunded_by_id);
        $this->assertSame('CANCELLED', $spk->fresh()->status);

        // Status gateway lama (settlement) tidak boleh menimpa refund admin.
        app(MidtransPaymentService::class)->applyTransactionStatus($order, ['transaction_status' => 'settlement']);
        $this->assertSame('REFUNDED', $order->fresh()->payment_status);

        $this->app['auth']->forgetGuards();
        $this->withToken($this->customer->createToken('mobile')->plainTextToken)
            ->getJson("/api/customer/v1/orders/{$order->uuid}")
            ->assertJsonPath('data.refund_amount', 7000000)
            ->assertJsonPath('data.cancellation_reason', 'Proyek ditunda');
    }

    public function test_admin_can_cancel_unpaid_order_without_refund(): void
    {
        $order = $this->pendingOrder(['status' => 'CONFIRMED']);

        $this->actingAs($this->admin)
            ->post(route('orders.cancel', $order), ['cancellation_reason' => 'Pelanggan tidak jadi'])
            ->assertSessionHas('success');

        $order->refresh();
        $this->assertSame('CANCELLED', $order->status);
        $this->assertSame('PENDING', $order->payment_status);
        $this->assertNull($order->refunded_at);
    }

    /**
     * @return array<string, mixed>
     */
    private function spkPayload(Order $order): array
    {
        return [
            'order_id' => $order->id,
            'product_id' => $this->mix->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function sjPayload(Order $order): array
    {
        return [
            'batching_plant_id' => $this->plant->id,
            'driver_id' => $this->driver->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => $this->driver->name,
            'items' => [[
                'order_id' => $order->id,
                'product_id' => $this->mix->id,
                'quantity_delivered' => 7,
                'destination_customer_name' => $order->customer_name,
                'destination_address' => $order->delivery_address,
                'delivery_sequence' => 1,
            ]],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function pendingOrder(array $overrides = []): Order
    {
        $order = Order::query()->create(array_merge([
            'code' => 'ORD-FLOW-'.fake()->unique()->numberBetween(100, 999),
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_phone' => $this->customer->phone,
            'customer_type' => 'B2C',
            'batching_plant_id' => $this->plant->id,
            'project_title' => 'Dak Lantai 2',
            'delivery_address' => 'Jl. Poros Tonasa II',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'distance_km' => 2.5,
            'status' => 'PENDING_APPROVAL',
            'payment_status' => 'PENDING',
            'payment_method' => 'MIDTRANS',
            'subtotal' => 6230000,
            'delivery_fee' => 100000,
            'ppn' => 696300,
            'admin_fee' => 4500,
            'total_price' => 7030800,
        ], $overrides));

        $order->items()->create([
            'product_id' => $this->mix->id,
            'quantity' => 7,
            'unit' => 'm³',
            'unit_price' => 890000,
            'subtotal' => 6230000,
        ]);

        return $order;
    }

    private function suratJalan(Order $order, string $status, float $qty = 7): SuratJalan
    {
        $sj = SuratJalan::query()->create([
            'code' => 'SJ-FLOW-'.fake()->unique()->numberBetween(100, 999),
            'batching_plant_id' => $this->plant->id,
            'driver_id' => $this->driver->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => $this->driver->name,
            'status' => $status,
        ]);

        $sj->items()->create([
            'order_id' => $order->id,
            'product_id' => $this->mix->id,
            'quantity_delivered' => $qty,
            'unit' => 'm³',
            'destination_customer_name' => $order->customer_name,
            'destination_address' => $order->delivery_address,
            'delivery_sequence' => 1,
            'status' => $status === 'COMPLETED' ? 'DELIVERED' : ($status === 'CANCELLED' ? 'REJECTED' : 'ON_TRUCK'),
        ]);

        return $sj;
    }
}
