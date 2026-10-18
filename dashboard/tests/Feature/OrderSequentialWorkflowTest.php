<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

class OrderSequentialWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Branch $branch;
    private BatchingPlant $plant;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->branch = Branch::query()->create([
            'code' => 'BR-SULSEL-01',
            'name' => 'Cabang Makassar',
            'is_active' => true,
        ]);

        $this->plant = BatchingPlant::query()->create([
            'branch_id' => $this->branch->id,
            'code' => 'BR-SULSEL-01-BP-01',
            'name' => 'Plant Panakkukang',
            'is_active' => true,
        ]);

        $this->product = Product::query()->create([
            'code' => 'RM-K225',
            'name' => 'Ready Mix K-225',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 840000,
            'max_trip_capacity' => 7.00,
            'allow_combined_delivery' => false,
            'min_order' => 1,
            'is_active' => true,
        ]);
    }

    private function createOrder(string $status = 'CONFIRMED', float $quantity = 7.00): Order
    {
        $order = Order::query()->create([
            'code' => 'ORD-202610-0001',
            'customer_name' => 'PT Megah Bangun',
            'customer_phone' => '081234567890',
            'project_title' => 'Pengecoran Gedung A',
            'delivery_address' => 'Jl. Metro Tanjung Bunga No. 1',
            'batching_plant_id' => $this->plant->id,
            'distance_km' => 5,
            'delivery_fee' => 150000,
            'subtotal' => 840000 * $quantity,
            'ppn' => (840000 * $quantity) * 0.11,
            'total_price' => (840000 * $quantity * 1.11) + 150000,
            'payment_status' => 'PAID',
            'status' => $status,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => $quantity,
            'fulfilled_quantity' => 0,
            'unit_price' => 840000,
            'subtotal' => 840000 * $quantity,
        ]);

        return $order;
    }

    public function test_user_cannot_manually_jump_order_status_to_completed(): void
    {
        $order = $this->createOrder('PROCESSING');

        // Attempting to send COMPLETED status directly
        $response = $this->actingAs($this->admin)->put("/sales/orders/{$order->uuid}", [
            'status' => 'COMPLETED',
            'payment_status' => 'PAID',
        ]);

        // Request should either fail validation or return with error flash
        $order->refresh();
        $this->assertNotEquals('COMPLETED', $order->status);
    }

    public function test_order_transitions_to_processing_when_spk_is_created(): void
    {
        $order = $this->createOrder('CONFIRMED', 7.00);

        $response = $this->actingAs($this->admin)->post('/production/work-orders', [
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'scheduled_time_slot' => 'Pagi (08:00 - 12:00)',
            'target_quantity' => 7.00,
            'batch_recipe_code' => 'K225-STD',
            'slump_target' => '12 ± 2 cm',
        ]);

        $response->assertRedirect('/production/work-orders');

        $order->refresh();
        $this->assertEquals('PROCESSING', $order->status);
        $this->assertDatabaseHas('work_orders', [
            'order_id' => $order->id,
            'target_quantity' => 7.00,
        ]);
    }

    public function test_order_transitions_to_on_delivery_when_surat_jalan_is_issued(): void
    {
        $order = $this->createOrder('CONFIRMED', 7.00);

        // 1. Create Work Order (SPK)
        $workOrder = WorkOrder::query()->create([
            'code' => 'WO-TEST-001',
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7.00,
            'produced_quantity' => 7.00,
            'dispatched_quantity' => 0,
            'unit' => 'm³',
            'status' => 'SCHEDULED',
        ]);
        $order->update(['status' => 'PROCESSING']);

        // 2. Issue Surat Jalan (Departing)
        $response = $this->actingAs($this->admin)->post('/dispatch/surat-jalan', [
            'batching_plant_id' => $this->plant->id,
            'vehicle_number' => 'DD 8888 XY',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Budi Santoso',
            'items' => [
                [
                    'order_id' => $order->id,
                    'work_order_id' => $workOrder->id,
                    'product_id' => $this->product->id,
                    'quantity_delivered' => 7.00,
                    'destination_customer_name' => $order->customer_name,
                    'destination_project_title' => $order->project_title,
                    'destination_address' => $order->delivery_address,
                    'delivery_sequence' => 1,
                ],
            ],
        ]);

        $response->assertRedirect('/dispatch/surat-jalan');

        $order->refresh();
        // IMPORTANT: Must be ON_DELIVERY, NOT COMPLETED! The truck is still in transit!
        $this->assertEquals('ON_DELIVERY', $order->status);

        $sj = SuratJalan::query()->where('vehicle_number', 'DD 8888 XY')->first();
        $this->assertNotNull($sj);
        $this->assertEquals('ON_THE_WAY', $sj->status);
    }

    public function test_order_automatically_becomes_completed_when_surat_jalan_delivery_is_finished(): void
    {
        $order = $this->createOrder('CONFIRMED', 7.00);

        $workOrder = WorkOrder::query()->create([
            'code' => 'WO-TEST-002',
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7.00,
            'produced_quantity' => 7.00,
            'dispatched_quantity' => 0,
            'unit' => 'm³',
            'status' => 'SCHEDULED',
        ]);
        $order->update(['status' => 'PROCESSING']);

        $this->actingAs($this->admin)->post('/dispatch/surat-jalan', [
            'batching_plant_id' => $this->plant->id,
            'vehicle_number' => 'DD 9999 ZZ',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Ahmad Dani',
            'items' => [
                [
                    'order_id' => $order->id,
                    'work_order_id' => $workOrder->id,
                    'product_id' => $this->product->id,
                    'quantity_delivered' => 7.00,
                    'destination_customer_name' => $order->customer_name,
                    'destination_project_title' => $order->project_title,
                    'destination_address' => $order->delivery_address,
                    'delivery_sequence' => 1,
                ],
            ],
        ]);

        $sj = SuratJalan::query()->where('vehicle_number', 'DD 9999 ZZ')->firstOrFail();

        // 3. Mark delivery finished on Surat Jalan
        $finishResponse = $this->actingAs($this->admin)->put("/dispatch/surat-jalan/{$sj->uuid}/status", [
            'status' => 'COMPLETED',
            'recipient_name' => 'Ir. Hendra (Site Manager)',
        ]);

        $finishResponse->assertRedirect("/dispatch/surat-jalan/{$sj->uuid}");

        $sj->refresh();
        $this->assertEquals('COMPLETED', $sj->status);

        // Order must now automatically be COMPLETED
        $order->refresh();
        $this->assertEquals('COMPLETED', $order->status);
    }

    public function test_work_order_cannot_be_deleted_if_already_dispatched(): void
    {
        $order = $this->createOrder('PROCESSING', 7.00);

        $workOrder = WorkOrder::query()->create([
            'code' => 'WO-PROTECTED-001',
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7.00,
            'produced_quantity' => 7.00,
            'dispatched_quantity' => 7.00,
            'unit' => 'm³',
            'status' => 'SCHEDULED',
        ]);

        $response = $this->actingAs($this->admin)->delete("/production/work-orders/{$workOrder->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('work_orders', ['id' => $workOrder->id]);
    }
}
