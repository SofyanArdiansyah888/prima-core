<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Tests\TestCase;

class CustomerOrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_login(): void
    {
        $register = $this->postJson('/api/customer/v1/register', [
            'name' => 'Toko Berkah',
            'phone' => '081234567890',
            'email' => 'berkah@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $register->assertCreated();
        $register->assertJsonPath('customer.phone', '081234567890');
        $this->assertNotEmpty($register->json('token'));

        $this->postJson('/api/customer/v1/login', [
            'phone' => '081234567890',
            'password' => 'salah',
        ])->assertStatus(422);

        $login = $this->postJson('/api/customer/v1/login', [
            'phone' => '081234567890',
            'password' => 'password',
        ]);

        $login->assertOk();
        $this->withToken($login->json('token'))
            ->getJson('/api/customer/v1/me')
            ->assertOk()
            ->assertJsonPath('data.name', 'Toko Berkah');
    }

    public function test_catalog_requires_auth_and_filters_category(): void
    {
        $this->seedCatalog();

        $this->getJson('/api/customer/v1/products')->assertUnauthorized();

        $token = $this->customerToken();

        $cement = $this->withToken($token)->getJson('/api/customer/v1/products?category=cement');
        $cement->assertOk();
        $this->assertCount(1, $cement->json('data'));
        $this->assertSame('cement', $cement->json('data.0.category'));
        $this->assertArrayNotHasKey('id', $cement->json('data.0'));

        $mix = $this->withToken($token)->getJson('/api/customer/v1/products?category=readymix');
        $mix->assertOk();
        $this->assertSame('RM-K300', $mix->json('data.0.code'));
    }

    public function test_quote_rejects_mixed_categories_and_orders_below_minimum(): void
    {
        ['cement' => $cement, 'mix' => $mix] = $this->seedCatalog();
        $token = $this->customerToken();

        $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'items' => [
                ['product_uuid' => $cement->uuid, 'quantity' => 20],
                ['product_uuid' => $mix->uuid, 'quantity' => 3],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors('items');

        $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'items' => [
                ['product_uuid' => $cement->uuid, 'quantity' => 5],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors('items');
    }

    public function test_customer_order_is_b2c_and_hidden_from_other_customers(): void
    {
        ['cement' => $cement] = $this->seedCatalog();
        $owner = Customer::query()->create([
            'name' => 'Pemilik',
            'phone' => '081111111111',
            'password' => 'password',
            'is_active' => true,
        ]);
        $other = Customer::query()->create([
            'name' => 'Lain',
            'phone' => '082222222222',
            'password' => 'password',
            'is_active' => true,
        ]);

        $token = $owner->createToken('mobile')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Renovasi toko',
            'delivery_address' => 'Jl. Poros Tonasa II, Bontoa, Kab. Pangkep',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'CASH',
            'items' => [
                ['product_uuid' => $cement->uuid, 'quantity' => 20],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'CONFIRMED');
        $response->assertJsonPath('data.payment_status', 'PENDING');
        $code = $response->json('data.code');
        $uuid = $response->json('data.uuid');
        $this->assertNotEmpty($uuid);

        $order = Order::query()->where('code', $code)->firstOrFail();
        $this->assertSame($owner->id, $order->customer_id);
        $this->assertSame('B2C', $order->customer_type);
        $this->assertNull($order->po_number);
        $this->assertEquals(78000, (float) $order->items()->firstOrFail()->unit_price);
        $this->assertEquals(1560000, (float) $order->subtotal);

        $this->app['auth']->forgetGuards();

        $this->withToken($other->createToken('mobile')->plainTextToken)
            ->getJson('/api/customer/v1/orders/'.$uuid)
            ->assertNotFound();

        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->postJson('/api/customer/v1/orders/'.$uuid.'/cancel')
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED');

        $this->withToken($token)
            ->postJson('/api/customer/v1/orders/'.$uuid.'/cancel')
            ->assertStatus(422);
    }

    public function test_customer_order_calculates_admin_fee_and_generates_midtrans_token(): void
    {
        ['cement' => $cement] = $this->seedCatalog();
        $token = $this->customerToken();

        $quote = $this->withToken($token)->postJson('/api/customer/v1/delivery/quote', [
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'items' => [
                ['product_uuid' => $cement->uuid, 'quantity' => 20],
            ],
        ]);

        $quote->assertOk();
        $this->assertEquals(4500, $quote->json('data.admin_fee'));
        $expectedTotal = round(1560000 + (float) $quote->json('data.delivery_fee') + (float) $quote->json('data.ppn') + 4500, 2);
        $this->assertEquals($expectedTotal, $quote->json('data.total_price'));

        $orderRes = $this->withToken($token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Pembangunan Ruko',
            'delivery_address' => 'Jl. Poros Tonasa II',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS',
            'items' => [
                ['product_uuid' => $cement->uuid, 'quantity' => 20],
            ],
        ]);

        $orderRes->assertCreated();
        $this->assertEquals(4500, $orderRes->json('data.admin_fee'));
        $this->assertNotEmpty($orderRes->json('data.snap_token'));

        $uuid = $orderRes->json('data.uuid');
        $code = $orderRes->json('data.code');

        // Test pay endpoint
        $payRes = $this->withToken($token)->postJson('/api/customer/v1/orders/'.$uuid.'/pay');
        $payRes->assertOk();
        $this->assertNotEmpty($payRes->json('data.snap_token'));

        // Test webhook
        $orderId = $code . '-sample';
        $grossAmount = (string) $expectedTotal;
        $serverKey = (string) config('services.midtrans.server_key', '');
        $signatureKey = hash('sha512', $orderId . '200' . $grossAmount . $serverKey);

        $webhook = $this->postJson('/api/customer/v1/payments/midtrans-webhook', [
            'order_id' => $orderId,
            'status_code' => '200',
            'gross_amount' => $grossAmount,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
            'transaction_id' => 'trx-123456',
            'signature_key' => $signatureKey,
        ]);

        $webhook->assertOk();
        $webhook->assertJsonPath('payment_status', 'PAID');
    }

    private function customerToken(): string
    {
        $customer = Customer::query()->create([
            'name' => 'Pelanggan',
            'phone' => '081300000099',
            'password' => 'password',
            'is_active' => true,
        ]);

        return $customer->createToken('mobile')->plainTextToken;
    }

    /**
     * @return array{cement: Product, mix: Product}
     */
    private function seedCatalog(): array
    {
        $branch = Branch::query()->create([
            'code' => 'BR-SULSEL-01',
            'name' => 'Sulawesi Selatan',
            'is_active' => true,
        ]);

        BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01',
            'branch_id' => $branch->id,
            'name' => 'Batching Plant Pangkep',
            'lat' => -4.783,
            'lng' => 119.557,
            'status' => 'OPERATIONAL',
            'is_active' => true,
        ]);

        $cement = Product::query()->create([
            'code' => 'ST-OPC-50KG',
            'name' => 'Semen Tonasa OPC Type I (50 kg/Sak)',
            'category' => 'cement',
            'unit' => 'Sak',
            'base_price' => 78000,
            'min_order' => 20,
            'is_active' => true,
        ]);

        $mix = Product::query()->create([
            'code' => 'RM-K300',
            'name' => 'Ready Mix Beton Mutu K-300',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 890000,
            'min_order' => 3,
            'is_active' => true,
        ]);

        return [
            'cement' => $cement,
            'mix' => $mix,
        ];
    }
}
