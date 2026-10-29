<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Shared\Enums\UserRole;
use Tests\TestCase;

class StaffMobileLoginTest extends TestCase
{
    use RefreshDatabase;

    private User $sales;

    private User $driver;

    protected function setUp(): void
    {
        parent::setUp();

        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulsel', 'is_active' => true]);

        $this->sales = User::factory()->create([
            'email' => 'sales@pkm.test',
            'phone' => '081241129902',
            'role' => UserRole::Sales,
            'branch_id' => $branch->id,
        ]);

        $this->driver = User::factory()->create([
            'email' => 'sopir@pkm.test',
            'phone' => '081241129901',
            'role' => UserRole::Driver,
            'branch_id' => $branch->id,
        ]);
    }

    public function test_sales_and_driver_login_through_single_endpoint(): void
    {
        $sales = $this->postJson('/api/staff/v1/login', ['login' => '081241129902', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.role', 'sales')
            ->assertJsonPath('user.branch.code', 'BR-SULSEL-01');

        $this->withToken($sales->json('token'))->getJson('/api/sales/v1/orders')->assertOk();

        $this->app['auth']->forgetGuards();
        $driver = $this->withoutToken()->postJson('/api/staff/v1/login', ['login' => 'SOPIR@pkm.test', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.role', 'driver');

        $this->app['auth']->forgetGuards();
        $this->withToken($driver->json('token'))->getJson('/api/driver/v1/deliveries')->assertOk();
    }

    public function test_phone_is_normalized(): void
    {
        foreach (['+62 812-4112-9901', '6281241129901', '81241129901'] as $login) {
            $this->postJson('/api/staff/v1/login', ['login' => $login, 'password' => 'password'])
                ->assertOk()
                ->assertJsonPath('user.id', $this->driver->id);
        }
    }

    public function test_rejects_wrong_password_inactive_and_non_staff_accounts(): void
    {
        $this->postJson('/api/staff/v1/login', ['login' => '081241129902', 'password' => 'salah'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('login');

        User::factory()->create(['email' => 'admin@pkm.test', 'role' => UserRole::Admin]);
        $this->postJson('/api/staff/v1/login', ['login' => 'admin@pkm.test', 'password' => 'password'])
            ->assertStatus(422);

        $this->driver->update(['is_active' => false]);
        $this->postJson('/api/staff/v1/login', ['login' => '081241129901', 'password' => 'password'])
            ->assertStatus(422);
    }

    public function test_logout_revokes_token_and_customer_token_is_rejected(): void
    {
        $token = $this->postJson('/api/staff/v1/login', ['login' => 'sales@pkm.test', 'password' => 'password'])->json('token');

        $this->withToken($token)->getJson('/api/staff/v1/me')->assertOk()->assertJsonPath('data.role', 'sales');
        $this->withToken($token)->postJson('/api/staff/v1/logout')->assertOk();
        $this->assertSame(0, $this->sales->tokens()->count());

        $this->app['auth']->forgetGuards();
        $customer = Customer::query()->create(['name' => 'C', 'phone' => '081300000001', 'password' => 'password', 'is_active' => true]);
        $this->withToken($customer->createToken('mobile')->plainTextToken)->getJson('/api/staff/v1/me')->assertForbidden();
    }
}
