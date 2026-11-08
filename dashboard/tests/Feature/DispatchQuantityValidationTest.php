<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\DeliveryRate\Models\PlantDeliveryRate;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

class DispatchQuantityValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private BatchingPlant $plant;

    private Product $mix;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plant = BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01', 'branch_id' => $branch->id, 'name' => 'Plant Pangkep',
            'lat' => -4.783, 'lng' => 119.557, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);
        $this->mix = Product::query()->create([
            'code' => 'RM-K300', 'name' => 'Ready Mix K-300', 'category' => 'readymix', 'unit' => 'm³',
            'base_price' => 890000, 'min_order' => 3, 'is_active' => true,
        ]);
        $this->admin = User::factory()->create(['role' => UserRole::Admin, 'branch_id' => $branch->id]);
    }

    private function paidOrder(string $code, float $qty, string $paymentStatus = 'PAID'): Order
    {
        $order = Order::query()->create([
            'code' => $code, 'customer_name' => 'Pelanggan', 'customer_phone' => '081300000001', 'customer_type' => 'B2C',
            'project_title' => 'Dak Lantai 2', 'delivery_address' => 'Jl. Poros', 'batching_plant_id' => $this->plant->id,
            'status' => 'CONFIRMED', 'total_price' => 1000000, 'payment_method' => 'MIDTRANS', 'payment_status' => $paymentStatus,
        ]);
        OrderItem::query()->create([
            'order_id' => $order->id, 'product_id' => $this->mix->id, 'quantity' => $qty, 'fulfilled_quantity' => 0,
            'unit' => 'm³', 'unit_price' => 890000, 'subtotal' => 890000 * $qty,
        ]);

        return $order;
    }

    private function spk(Order $order, float $target)
    {
        return $this->actingAs($this->admin)->post(route('work-orders.store'), [
            'order_id' => $order->id,
            'product_id' => $this->mix->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => $target,
        ]);
    }

    private function suratJalan(Order $order, ?WorkOrder $wo, float $qty)
    {
        return $this->actingAs($this->admin)->post(route('surat-jalan.store'), [
            'batching_plant_id' => $this->plant->id,
            'vehicle_number' => 'DD 8912 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Pak Sopir',
            'items' => [[
                'order_id' => $order->id,
                'work_order_id' => $wo?->id,
                'product_id' => $this->mix->id,
                'quantity_delivered' => $qty,
                'destination_customer_name' => 'Pelanggan',
                'destination_address' => 'Jl. Poros',
                'delivery_sequence' => 1,
            ]],
        ]);
    }

    public function test_spk_target_cannot_exceed_ordered_quantity(): void
    {
        $order = $this->paidOrder('SO-TEST-1', 3);

        $this->spk($order, 3)->assertSessionHasNoErrors();
        // SPK kedua untuk item yang sama → total 6 > 3 dipesan
        $this->spk($order, 3)->assertSessionHasErrors('target_quantity');
        $this->assertSame(1, WorkOrder::query()->where('order_id', $order->id)->count());
    }

    public function test_surat_jalan_volume_cannot_exceed_remaining_order_or_spk(): void
    {
        $order = $this->paidOrder('SO-TEST-2', 10);
        $this->spk($order, 10)->assertSessionHasNoErrors();
        $wo = WorkOrder::query()->where('order_id', $order->id)->firstOrFail();

        $this->suratJalan($order, $wo, 7)->assertSessionHasNoErrors();
        $this->assertEquals(7, (float) $order->items()->first()->fulfilled_quantity);

        // Sisa 3 → 3,1 ditolak, 3 diterima
        $this->suratJalan($order, $wo, 3.1)->assertSessionHasErrors('items.0.quantity_delivered');
        $this->suratJalan($order, $wo, 3)->assertSessionHasNoErrors();
        $this->assertEquals(10, (float) $order->items()->first()->fulfilled_quantity);
    }

    public function test_delivery_stop_list_only_shows_paid_orders_with_remaining_volume(): void
    {
        $paid = $this->paidOrder('SO-PAID', 3);
        $unpaid = $this->paidOrder('SO-UNPAID', 3, 'PENDING');
        $full = $this->paidOrder('SO-FULL', 3);

        foreach ([$paid, $full] as $o) {
            $this->spk($o, 3)->assertSessionHasNoErrors();
        }
        WorkOrder::query()->create([
            'order_id' => $unpaid->id, 'code' => 'WO-UNPAID', 'product_id' => $this->mix->id, 'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(), 'target_quantity' => 3, 'produced_quantity' => 0, 'dispatched_quantity' => 0,
            'unit' => 'm³', 'status' => 'SCHEDULED',
        ]);
        // SO-FULL sudah terkirim penuh, tapi SPK-nya masih tercatat belum dispatch penuh
        $full->items()->update(['fulfilled_quantity' => 3]);

        $this->actingAs($this->admin)->get(route('surat-jalan.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('activeOrders', 1)
                ->where('activeOrders.0.code', 'SO-PAID'));
    }

    public function test_spk_form_lists_only_paid_orders_without_active_spk(): void
    {
        $fresh = $this->paidOrder('SO-FRESH', 3);
        $this->paidOrder('SO-UNPAID-2', 3, 'PENDING');
        $hasSpk = $this->paidOrder('SO-HAS-SPK', 3);
        $this->spk($hasSpk, 3)->assertSessionHasNoErrors();

        $this->actingAs($this->admin)->get(route('work-orders.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders', 1)
                ->where('orders.0.code', 'SO-FRESH'));

        // Membuka form langsung untuk pesanan yang sudah punya SPK → dialihkan
        $this->actingAs($this->admin)->get(route('work-orders.create', ['order_id' => $hasSpk->id]))
            ->assertRedirect(route('work-orders.index'));
    }

    public function test_delivery_rate_is_always_saved_as_flat(): void
    {
        $this->actingAs($this->admin)->post('/master/delivery-rates', [
            'batching_plant_id' => $this->plant->id,
            'min_distance_km' => 0,
            'max_distance_km' => 10,
            'rate_type' => 'PER_UNIT_PER_KM',
            'base_fee' => 150000,
            'min_charge' => 250000,
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $rate = PlantDeliveryRate::query()->firstOrFail();
        $this->assertSame('FLAT_PER_TRIP', $rate->rate_type);
        $this->assertEquals(0, (float) $rate->cost_per_km_unit);
    }
}
