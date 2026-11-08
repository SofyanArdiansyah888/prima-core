<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Enums\UserRole;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

/**
 * Pemisahan data transaksional per batching plant.
 */
class PlantAccessTest extends TestCase
{
    use RefreshDatabase;

    private BatchingPlant $plantA;

    private BatchingPlant $plantB;

    private Product $mix;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        $this->branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plantA = $this->plant('BR-SULSEL-01-BP-01', 'Plant A');
        $this->plantB = $this->plant('BR-SULSEL-01-BP-02', 'Plant B');
        $this->mix = Product::query()->create([
            'code' => 'RM-K300', 'name' => 'Ready Mix K-300', 'category' => 'readymix', 'unit' => 'm³',
            'base_price' => 890000, 'min_order' => 3, 'is_active' => true,
        ]);
    }

    private function plant(string $code, string $name): BatchingPlant
    {
        return BatchingPlant::query()->create([
            'code' => $code, 'branch_id' => $this->branch->id, 'name' => $name,
            'lat' => -4.78, 'lng' => 119.55, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);
    }

    private function user(UserRole $role, array $plants = [], bool $full = false): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'branch_id' => $role === UserRole::Admin ? null : $this->branch->id,
            'has_full_plant_access' => $full,
        ]);
        $user->batchingPlants()->attach(array_map(fn (BatchingPlant $p) => $p->id, $plants));

        return $user;
    }

    private function order(BatchingPlant $plant, string $code, string $status = 'CONFIRMED'): Order
    {
        $order = Order::query()->create([
            'code' => $code, 'customer_name' => 'Pelanggan '.$code, 'customer_phone' => '081300000001', 'customer_type' => 'B2C',
            'project_title' => 'Proyek', 'delivery_address' => 'Jl. Poros', 'batching_plant_id' => $plant->id,
            'status' => $status, 'total_price' => 1000000, 'payment_method' => 'MIDTRANS', 'payment_status' => 'PAID',
        ]);
        OrderItem::query()->create([
            'order_id' => $order->id, 'product_id' => $this->mix->id, 'quantity' => 7, 'fulfilled_quantity' => 0,
            'unit' => 'm³', 'unit_price' => 890000, 'subtotal' => 890000 * 7,
        ]);

        return $order;
    }

    private function workOrder(Order $order): WorkOrder
    {
        return WorkOrder::query()->create([
            'order_id' => $order->id, 'code' => 'WO-'.$order->code, 'product_id' => $this->mix->id,
            'batching_plant_id' => $order->batching_plant_id, 'scheduled_date' => now()->toDateString(),
            'target_quantity' => 7, 'produced_quantity' => 0, 'dispatched_quantity' => 0, 'unit' => 'm³', 'status' => 'SCHEDULED',
        ]);
    }

    private function suratJalan(BatchingPlant $plant, string $code): SuratJalan
    {
        return SuratJalan::query()->create([
            'code' => $code, 'batching_plant_id' => $plant->id, 'vehicle_number' => 'DD 1 PKM',
            'vehicle_type' => 'MIXER_TRUCK_7M3', 'driver_name' => 'Sopir', 'status' => 'ON_THE_WAY',
        ]);
    }

    public function test_operator_only_sees_own_plant_in_lists(): void
    {
        $this->order($this->plantA, 'SO-A');
        $this->order($this->plantB, 'SO-B');
        $this->workOrder(Order::query()->where('code', 'SO-A')->first());
        $this->workOrder(Order::query()->where('code', 'SO-B')->first());
        $this->suratJalan($this->plantA, 'SJ-A');
        $this->suratJalan($this->plantB, 'SJ-B');

        $operator = $this->user(UserRole::User, [$this->plantA]);

        $this->actingAs($operator)->get(route('orders.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.code', 'SO-A')
                ->has('plants', 1)->where('plants.0.id', $this->plantA->id));
        $this->get(route('work-orders.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->has('workOrders.data', 1)->where('workOrders.data.0.code', 'WO-SO-A'));
        $this->get(route('surat-jalan.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->has('suratJalans.data', 1)->where('suratJalans.data.0.code', 'SJ-A'));
        $this->get(route('dashboard'))->assertOk()
            ->assertInertia(fn ($page) => $page->where('stats.orders', 1)->where('stats.dispatches', 1)->where('stats.plants', 1));
        $this->get(route('reports.sales', ['from' => now()->subDay()->toDateString(), 'to' => now()->toDateString()]))->assertOk()
            ->assertInertia(fn ($page) => $page->has('records', 1)->where('records.0.code', 'SO-A'));
    }

    public function test_operator_cannot_open_or_act_on_other_plant_records(): void
    {
        $orderB = $this->order($this->plantB, 'SO-B', 'PENDING_APPROVAL');
        $woB = $this->workOrder($this->order($this->plantB, 'SO-B2'));
        $sjB = $this->suratJalan($this->plantB, 'SJ-B');
        $operator = $this->user(UserRole::User, [$this->plantA]);

        $this->actingAs($operator);
        $this->get(route('orders.show', $orderB))->assertForbidden();
        $this->post(route('orders.approve', $orderB))->assertForbidden();
        $this->post(route('orders.reject', $orderB), ['rejection_reason' => 'x'])->assertForbidden();
        $this->get(route('work-orders.show', $woB))->assertForbidden();
        $this->delete(route('work-orders.destroy', $woB))->assertForbidden();
        $this->get(route('surat-jalan.show', $sjB))->assertForbidden();
        $this->get(route('surat-jalan.print', $sjB))->assertForbidden();
        $this->put(route('surat-jalan.update-status', $sjB), ['status' => 'CANCELLED'])->assertForbidden();
        $this->get(route('reports.sales', ['batching_plant_id' => $this->plantB->id]))->assertForbidden();
        $this->get(route('work-orders.create', ['order_id' => $orderB->id]))->assertForbidden();
    }

    public function test_operator_cannot_create_spk_or_surat_jalan_for_other_plant(): void
    {
        $orderA = $this->order($this->plantA, 'SO-A');
        $orderB = $this->order($this->plantB, 'SO-B');
        $woA = $this->workOrder($orderA);
        $operator = $this->user(UserRole::User, [$this->plantA]);

        $this->actingAs($operator)->post(route('work-orders.store'), [
            'order_id' => $orderB->id, 'product_id' => $this->mix->id, 'batching_plant_id' => $this->plantB->id,
            'scheduled_date' => now()->toDateString(), 'target_quantity' => 7,
        ])->assertSessionHasErrors('order_id');
        $this->assertSame(1, WorkOrder::query()->count());

        $sj = fn (int $plantId, Order $order, ?WorkOrder $wo) => [
            'batching_plant_id' => $plantId, 'vehicle_number' => 'DD 1 PKM', 'vehicle_type' => 'MIXER_TRUCK_7M3', 'driver_name' => 'Sopir',
            'items' => [[
                'order_id' => $order->id, 'work_order_id' => $wo?->id, 'product_id' => $this->mix->id, 'quantity_delivered' => 3,
                'destination_customer_name' => 'Pelanggan', 'destination_address' => 'Jl. Poros', 'delivery_sequence' => 1,
            ]],
        ];

        // Plant lain → ditolak
        $this->post(route('surat-jalan.store'), $sj($this->plantB->id, $orderB, null))->assertSessionHasErrors('batching_plant_id');
        // Plant sendiri tapi pesanan dari plant lain → ditolak
        $this->post(route('surat-jalan.store'), $sj($this->plantA->id, $orderB, null))->assertSessionHasErrors('items.0.order_id');
        // Plant & pesanan sendiri → berhasil
        $this->post(route('surat-jalan.store'), $sj($this->plantA->id, $orderA, $woA))->assertSessionHasNoErrors();
        $this->assertSame(1, SuratJalan::query()->count());
    }

    public function test_admin_and_full_access_user_see_all_plants(): void
    {
        $this->order($this->plantA, 'SO-A');
        $orderB = $this->order($this->plantB, 'SO-B');

        foreach ([$this->user(UserRole::Admin), $this->user(UserRole::User, [], full: true)] as $user) {
            $this->actingAs($user)->get(route('orders.index'))->assertOk()
                ->assertInertia(fn ($page) => $page->has('orders.data', 2));
            $this->get(route('orders.show', $orderB))->assertOk();
            $this->app['auth']->forgetGuards();
        }
    }

    public function test_operator_without_plants_sees_nothing(): void
    {
        $this->order($this->plantA, 'SO-A');
        $operator = $this->user(UserRole::User);

        $this->actingAs($operator)->get(route('orders.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 0)->where('auth.plants', []));
    }

    public function test_sales_and_driver_cannot_use_dashboard(): void
    {
        foreach ([UserRole::Sales, UserRole::Driver] as $role) {
            $user = $this->user($role, [$this->plantA]);

            $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
                ->assertSessionHasErrors('email');
            $this->assertGuest();

            // Sesi yang sudah ada diakhiri
            $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
            $this->assertGuest();
        }
    }

    public function test_sales_api_is_limited_to_assigned_plants(): void
    {
        $orderA = $this->order($this->plantA, 'SO-A', 'PENDING_APPROVAL');
        $orderB = $this->order($this->plantB, 'SO-B', 'PENDING_APPROVAL');
        $sales = $this->user(UserRole::Sales, [$this->plantA]);
        $token = $sales->createToken('sales')->plainTextToken;

        $this->withToken($token)->getJson('/api/sales/v1/orders?tab=pending')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.code', 'SO-A');
        $this->withToken($token)->getJson("/api/sales/v1/orders/{$orderB->uuid}")->assertForbidden();
        $this->withToken($token)->postJson("/api/sales/v1/orders/{$orderB->uuid}/approve")->assertForbidden();
        $this->withToken($token)->getJson("/api/sales/v1/orders/{$orderA->uuid}")->assertOk();
    }
}
