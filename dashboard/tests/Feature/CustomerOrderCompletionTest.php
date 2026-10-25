<?php

namespace Tests\Feature;

use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Tests\TestCase;

class CustomerOrderCompletionTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    private Customer $customer;
    private Order $order;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $branch = Branch::query()->create([
            'code' => 'BR-TEST-03',
            'name' => 'Cabang Test 3',
            'address' => 'Jl. Test',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BP-TEST-03',
            'name' => 'Plant Test 3',
            'lat' => -5.112,
            'lng' => 119.489,
            'is_active' => true,
        ]);

        $this->customer = Customer::query()->create([
            'name' => 'Pelanggan Mandiri',
            'phone' => '081399990003',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $cat = ProductCategory::query()->create([
            'code' => 'CAT-TEST-3',
            'name' => 'Ready Mix',
            'slug' => 'ready-mix-3',
        ]);

        $this->product = Product::query()->create([
            'category_id' => $cat->id,
            'code' => 'PROD-K225',
            'name' => 'Beton K-225',
            'unit' => 'm³',
            'price' => 780000,
            'is_active' => true,
        ]);

        $this->order = Order::query()->create([
            'customer_id' => $this->customer->id,
            'code' => 'ORD-TEST-004',
            'customer_name' => 'Pelanggan Mandiri',
            'customer_phone' => '081399990003',
            'customer_type' => 'B2C',
            'project_title' => 'Cor Kolam Renang',
            'batching_plant_id' => $plant->id,
            'delivery_address' => 'Jl. Veteran No 10',
            'status' => 'ON_DELIVERY',
            'delivered_at' => now(),
            'total_price' => 7800000,
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PAID',
        ]);
    }

    public function test_customer_can_confirm_order_completion_when_fulfilled(): void
    {
        $token = $this->customer->createToken('test')->plainTextToken;

        OrderItem::query()->create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'quantity' => 10.0,
            'fulfilled_quantity' => 10.0,
            'unit' => 'm³',
            'unit_price' => 780000,
            'subtotal' => 7800000,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/customer/v1/orders/{$this->order->uuid}/confirm-complete");

        $response->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.completed_by', 'CUSTOMER');

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'COMPLETED',
            'completed_by' => 'CUSTOMER',
        ]);
        $this->assertNotNull($this->order->fresh()->customer_confirmed_at);
    }

    public function test_customer_cannot_confirm_if_items_not_fully_fulfilled(): void
    {
        $token = $this->customer->createToken('test')->plainTextToken;

        OrderItem::query()->create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'quantity' => 10.0,
            'fulfilled_quantity' => 5.0, // Partial delivery (only 5 of 10)
            'unit' => 'm³',
            'unit_price' => 780000,
            'subtotal' => 7800000,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/customer/v1/orders/{$this->order->uuid}/confirm-complete");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertSame('ON_DELIVERY', $this->order->fresh()->status);
    }
}
