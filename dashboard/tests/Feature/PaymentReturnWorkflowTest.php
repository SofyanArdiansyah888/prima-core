<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\PaymentReturn\Models\PaymentReturn;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

/**
 * Berita Acara retur pembayaran sebagian + print SO/SPK.
 */
class PaymentReturnWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private BatchingPlant $plant;

    private BatchingPlant $otherPlant;

    private Order $order;

    private OrderItem $item;

    private User $admin;

    /** @var array<string, User> */
    private array $approvers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plant = BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01', 'branch_id' => $branch->id, 'name' => 'BP Pangkep',
            'lat' => -4.783, 'lng' => 119.557, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);
        $this->otherPlant = BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-02', 'branch_id' => $branch->id, 'name' => 'BP Maros',
            'lat' => -5.0, 'lng' => 119.6, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);

        $product = Product::query()->create([
            'code' => 'RM-K300', 'name' => 'Ready Mix K-300', 'category' => 'readymix',
            'unit' => 'm³', 'base_price' => 1000000, 'min_order' => 1, 'is_active' => true,
        ]);

        // Pesan 10 m³ @ Rp1.000.000, lunas; terkirim (terpakai cor) 8 m³.
        $this->order = Order::query()->create([
            'code' => 'SO-SULSEL-20261100001',
            'customer_name' => 'H. Syamsuddin',
            'customer_phone' => '081300000001',
            'customer_type' => 'B2C',
            'batching_plant_id' => $this->plant->id,
            'project_title' => 'Dak Lantai 2',
            'delivery_address' => 'Jl. Poros Tonasa II',
            'status' => 'ON_DELIVERY',
            'payment_status' => 'PAID',
            'payment_method' => 'MIDTRANS',
            'subtotal' => 10000000,
            'delivery_fee' => 500000,
            'distance_km' => 5,
            'ppn' => 1155000,
            'admin_fee' => 0,
            'total_price' => 11655000,
        ]);
        $this->item = $this->order->items()->create([
            'product_id' => $product->id,
            'quantity' => 10,
            'fulfilled_quantity' => 8,
            'unit' => 'm³',
            'unit_price' => 1000000,
            'subtotal' => 10000000,
        ]);

        $this->admin = User::factory()->create(['role' => UserRole::Admin, 'branch_id' => $branch->id]);
        foreach (UserRole::approverRoles() as $role) {
            $this->approvers[$role->value] = User::factory()->create(['role' => $role, 'has_full_plant_access' => true]);
        }
    }

    private function createReturn(float $qty = 2): PaymentReturn
    {
        $this->actingAs($this->admin)->post(route('payment-returns.store'), [
            'order_uuid' => $this->order->uuid,
            'reason' => 'Volume cor hanya terpakai 8 m³ dari 10 m³.',
            'customer_bank_name' => 'BRI',
            'customer_bank_account' => '1234567890',
            'customer_account_name' => 'H. Syamsuddin',
            'items' => [['order_item_id' => $this->item->id, 'quantity' => $qty]],
        ])->assertRedirect()->assertSessionHasNoErrors();

        return PaymentReturn::query()->latest('id')->firstOrFail();
    }

    public function test_partial_return_amount_is_returned_volume_times_price_plus_ppn(): void
    {
        $ba = $this->createReturn(2);

        $this->assertStringStartsWith('BA-RET-SULSEL-', $ba->code);
        $this->assertSame('PENDING_MANAGER', $ba->status);
        $this->assertEquals(2000000, (float) $ba->subtotal);
        $this->assertEquals(220000, (float) $ba->ppn);
        $this->assertEquals(2220000, (float) $ba->amount);
        $this->assertSame($this->plant->id, $ba->batching_plant_id);
    }

    public function test_return_volume_cannot_exceed_ordered_quantity_across_returns(): void
    {
        $this->createReturn(6);

        $this->actingAs($this->admin)->post(route('payment-returns.store'), [
            'order_uuid' => $this->order->uuid,
            'reason' => 'Retur kedua',
            'items' => [['order_item_id' => $this->item->id, 'quantity' => 5]],
        ])->assertSessionHasErrors('items.0.quantity');
    }

    public function test_unpaid_order_cannot_get_return(): void
    {
        $this->order->update(['payment_status' => 'PENDING']);

        $this->actingAs($this->admin)->post(route('payment-returns.store'), [
            'order_uuid' => $this->order->uuid,
            'reason' => 'x',
            'items' => [['order_item_id' => $this->item->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('items');
    }

    public function test_only_admin_can_create_return(): void
    {
        $this->actingAs($this->approvers['manager'])->post(route('payment-returns.store'), [
            'order_uuid' => $this->order->uuid,
            'reason' => 'x',
            'items' => [['order_item_id' => $this->item->id, 'quantity' => 1]],
        ])->assertForbidden();
    }

    public function test_approval_must_follow_sequence_and_refund_updates_order(): void
    {
        $ba = $this->createReturn(2);

        // Direksi tidak boleh melompati Manager
        $this->actingAs($this->approvers['direksi'])->post(route('payment-returns.approve', $ba))->assertForbidden();
        // Admin bukan penyetuju tahap
        $this->actingAs($this->admin)->post(route('payment-returns.approve', $ba))->assertForbidden();

        $expected = ['manager' => 'PENDING_KADIV', 'kepala_divisi' => 'PENDING_FINANCE', 'keuangan' => 'PENDING_DIRECTOR', 'direksi' => 'APPROVED'];
        foreach ($expected as $role => $nextStatus) {
            $this->actingAs($this->approvers[$role])->post(route('payment-returns.approve', $ba), ['notes' => "OK {$role}"])->assertRedirect();
            $this->assertSame($nextStatus, $ba->fresh()->status);
        }
        $this->assertCount(4, $ba->approvals()->get());

        // Hanya keuangan / admin yang menandai dana dikembalikan
        $this->actingAs($this->approvers['manager'])->post(route('payment-returns.refund', $ba), ['refund_reference' => 'TRF-1'])->assertForbidden();
        $this->actingAs($this->approvers['keuangan'])->post(route('payment-returns.refund', $ba), ['refund_reference' => 'TRF-001'])->assertRedirect();

        $this->assertSame('REFUNDED', $ba->fresh()->status);
        $order = $this->order->fresh();
        $this->assertEquals(2220000, (float) $order->refund_amount);
        // Retur sebagian: pesanan tetap lunas
        $this->assertSame('PAID', $order->payment_status);
    }

    public function test_rejection_stops_workflow_and_frees_volume(): void
    {
        $ba = $this->createReturn(2);

        $this->actingAs($this->approvers['manager'])->post(route('payment-returns.reject', $ba), ['notes' => ''])->assertSessionHasErrors('notes');
        $this->actingAs($this->approvers['manager'])->post(route('payment-returns.reject', $ba), ['notes' => 'Volume belum dicek'])->assertRedirect();

        $this->assertSame('REJECTED', $ba->fresh()->status);
        $this->actingAs($this->approvers['kepala_divisi'])->post(route('payment-returns.approve', $ba))->assertSessionHasErrors('status');

        // Volume dari BA yang ditolak bisa diajukan ulang
        $this->createReturn(10);
    }

    public function test_approver_without_plant_access_cannot_see_return(): void
    {
        $ba = $this->createReturn(2);
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $manager->batchingPlants()->attach($this->otherPlant->id);

        $this->actingAs($manager)->get(route('payment-returns.show', $ba))->assertForbidden();
        $this->actingAs($this->approvers['manager'])->get(route('payment-returns.show', $ba))->assertOk();
        $this->actingAs(User::factory()->create(['role' => UserRole::User, 'has_full_plant_access' => true]))
            ->get(route('payment-returns.index'))->assertForbidden();
    }

    public function test_print_documents_render_pdf(): void
    {
        $ba = $this->createReturn(2);
        $workOrder = WorkOrder::query()->create([
            'code' => 'WO-TEST-0001',
            'order_id' => $this->order->id,
            'batching_plant_id' => $this->plant->id,
            'product_id' => $this->item->product_id,
            'target_quantity' => 10,
            'unit' => 'm³',
            'scheduled_date' => now()->toDateString(),
            'status' => 'SCHEDULED',
        ]);

        $this->actingAs($this->admin)->get(route('orders.print', $this->order))
            ->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->actingAs($this->admin)->get(route('work-orders.print', $workOrder))
            ->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->actingAs($this->admin)->get(route('payment-returns.print', $ba))
            ->assertOk()->assertHeader('content-type', 'application/pdf');

        $outsider = User::factory()->create(['role' => UserRole::User]);
        $outsider->batchingPlants()->attach($this->otherPlant->id);
        $this->actingAs($outsider)->get(route('orders.print', $this->order))->assertForbidden();
    }
}
