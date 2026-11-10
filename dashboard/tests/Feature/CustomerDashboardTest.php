<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Shared\Enums\UserRole;
use Tests\TestCase;

/**
 * Halaman pelanggan di dashboard: visibilitas per batching plant & aktif/nonaktif akun.
 */
class CustomerDashboardTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    private BatchingPlant $plantA;

    private BatchingPlant $plantB;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        $this->branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        $this->plantA = $this->plant('BR-SULSEL-01-BP-01', 'Plant A');
        $this->plantB = $this->plant('BR-SULSEL-01-BP-02', 'Plant B');
    }

    private function plant(string $code, string $name): BatchingPlant
    {
        return BatchingPlant::query()->create([
            'code' => $code, 'branch_id' => $this->branch->id, 'name' => $name,
            'lat' => -4.78, 'lng' => 119.55, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);
    }

    private function user(UserRole $role, array $plants = []): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'branch_id' => $role === UserRole::Admin ? null : $this->branch->id,
        ]);
        $user->batchingPlants()->attach(array_map(fn (BatchingPlant $p) => $p->id, $plants));

        return $user;
    }

    private function customer(string $phone, string $name): Customer
    {
        return Customer::query()->create([
            'name' => $name, 'phone' => $phone, 'password' => 'password', 'is_active' => true,
        ]);
    }

    private function order(Customer $customer, BatchingPlant $plant, string $code, float $total = 1000000, string $status = 'CONFIRMED'): Order
    {
        return Order::query()->create([
            'code' => $code, 'customer_id' => $customer->id, 'customer_name' => $customer->name,
            'customer_phone' => $customer->phone, 'customer_type' => 'B2C', 'project_title' => 'Proyek',
            'delivery_address' => 'Jl. Poros', 'batching_plant_id' => $plant->id, 'status' => $status,
            'total_price' => $total, 'payment_method' => 'MIDTRANS', 'payment_status' => 'PAID',
        ]);
    }

    public function test_admin_sees_all_customers_with_stats(): void
    {
        $budi = $this->customer('081300000011', 'Budi');
        $this->customer('081300000012', 'Tanpa Order');
        $this->order($budi, $this->plantA, 'SO-1', 1000000);
        $this->order($budi, $this->plantB, 'SO-2', 2000000);
        $this->order($budi, $this->plantB, 'SO-3', 5000000, 'CANCELLED');

        $this->actingAs($this->user(UserRole::Admin))
            ->get(route('customers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('modules/customer/index')
                ->has('customers.data', 2)
                ->where('can_toggle', true)
                ->where('customers.data.1.name', 'Budi')
                ->where('customers.data.1.orders_count', 3)
                ->where('customers.data.1.orders_total', fn ($v) => (float) $v === 3000000.0));
    }

    public function test_operator_only_sees_customers_who_ordered_at_own_plant(): void
    {
        $a = $this->customer('081300000021', 'Pelanggan A');
        $b = $this->customer('081300000022', 'Pelanggan B');
        $this->customer('081300000023', 'Belum Order');
        $this->order($a, $this->plantA, 'SO-A');
        $this->order($a, $this->plantB, 'SO-A2', 7000000);
        $this->order($b, $this->plantB, 'SO-B');

        $operator = $this->user(UserRole::User, [$this->plantA]);

        $this->actingAs($operator)->get(route('customers.index'))->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Pelanggan A')
                ->where('customers.data.0.orders_count', 1)
                ->where('can_toggle', false));

        $this->actingAs($operator)->get(route('customers.show', $a))->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('modules/customer/show')
                ->has('orders.data', 1)
                ->where('orders.data.0.code', 'SO-A')
                ->where('stats.orders_count', 1));

        $this->actingAs($operator)->get(route('customers.show', $b))->assertForbidden();
    }

    public function test_operator_without_plant_sees_no_customers(): void
    {
        $this->order($this->customer('081300000031', 'X'), $this->plantA, 'SO-X');

        $this->actingAs($this->user(UserRole::User))->get(route('customers.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->has('customers.data', 0));
    }

    public function test_search_filters_by_name_phone_email(): void
    {
        $this->customer('081300000041', 'Andi Pratama');
        $this->customer('081300000042', 'Siti');

        $admin = $this->user(UserRole::Admin);

        $this->actingAs($admin)->get(route('customers.index', ['search' => 'andi']))
            ->assertInertia(fn ($page) => $page->has('customers.data', 1)->where('customers.data.0.name', 'Andi Pratama'));
        $this->actingAs($admin)->get(route('customers.index', ['search' => '0042']))
            ->assertInertia(fn ($page) => $page->has('customers.data', 1)->where('customers.data.0.name', 'Siti'));
    }

    public function test_admin_can_deactivate_customer_and_revoke_tokens(): void
    {
        $customer = $this->customer('081300000051', 'Nonaktif');
        $customer->createToken('mobile');

        $this->actingAs($this->user(UserRole::Admin))
            ->patch(route('customers.toggle-active', $customer))
            ->assertRedirect();

        $customer->refresh();
        $this->assertFalse($customer->is_active);
        $this->assertSame(0, $customer->tokens()->count());

        $this->postJson('/api/customer/v1/login', ['phone' => '081300000051', 'password' => 'password'])
            ->assertUnprocessable();

        $this->actingAs($this->user(UserRole::Admin))->patch(route('customers.toggle-active', $customer));
        $this->assertTrue($customer->refresh()->is_active);
    }

    public function test_operator_cannot_toggle_customer(): void
    {
        $customer = $this->customer('081300000061', 'C');
        $this->order($customer, $this->plantA, 'SO-C');

        $this->actingAs($this->user(UserRole::User, [$this->plantA]))
            ->patch(route('customers.toggle-active', $customer))
            ->assertForbidden();

        $this->assertTrue($customer->refresh()->is_active);
    }
}
