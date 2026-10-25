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

class AutoCompleteOrdersCommandTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    public function test_auto_complete_orders_command_handles_48h_timeout_properly(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-04',
            'name' => 'Cabang Test 4',
            'address' => 'Jl. Test',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BP-TEST-04',
            'name' => 'Plant Test 4',
            'lat' => -5.112,
            'lng' => 119.489,
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'name' => 'Pelanggan Timeout',
            'phone' => '081399990004',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $cat = ProductCategory::query()->create([
            'code' => 'CAT-TEST-4',
            'name' => 'Ready Mix',
            'slug' => 'ready-mix-4',
        ]);

        $product = Product::query()->create([
            'category_id' => $cat->id,
            'code' => 'PROD-K350',
            'name' => 'Beton K-350',
            'unit' => 'm³',
            'price' => 900000,
            'is_active' => true,
        ]);

        // Order 1: Delivered 20 hours ago (should NOT be auto-completed)
        $recentOrder = Order::query()->create([
            'customer_id' => $customer->id,
            'code' => 'ORD-RECENT',
            'customer_name' => 'Pelanggan Timeout',
            'customer_phone' => '081399990004',
            'customer_type' => 'B2C',
            'project_title' => 'Pengecoran Ruko 1',
            'batching_plant_id' => $plant->id,
            'delivery_address' => 'Jl. Proyek A',
            'status' => 'ON_DELIVERY',
            'delivered_at' => now()->subHours(20),
            'total_price' => 4500000,
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PAID',
        ]);
        OrderItem::query()->create([
            'order_id' => $recentOrder->id,
            'product_id' => $product->id,
            'quantity' => 5.0,
            'fulfilled_quantity' => 5.0,
            'unit' => 'm³',
            'unit_price' => 900000,
            'subtotal' => 4500000,
        ]);

        // Order 2: Delivered 50 hours ago (> 48h, SHOULD BE auto-completed)
        $expiredOrder = Order::query()->create([
            'customer_id' => $customer->id,
            'code' => 'ORD-EXPIRED',
            'customer_name' => 'Pelanggan Timeout',
            'customer_phone' => '081399990004',
            'customer_type' => 'B2C',
            'project_title' => 'Pengecoran Ruko 2',
            'batching_plant_id' => $plant->id,
            'delivery_address' => 'Jl. Proyek B',
            'status' => 'ON_DELIVERY',
            'delivered_at' => now()->subHours(50),
            'total_price' => 4500000,
            'payment_method' => 'MIDTRANS',
            'payment_status' => 'PAID',
        ]);
        OrderItem::query()->create([
            'order_id' => $expiredOrder->id,
            'product_id' => $product->id,
            'quantity' => 5.0,
            'fulfilled_quantity' => 5.0,
            'unit' => 'm³',
            'unit_price' => 900000,
            'subtotal' => 4500000,
        ]);

        // Run the artisan command
        $this->artisan('orders:auto-complete')
            ->assertExitCode(0);

        // Verify Order 1 remains ON_DELIVERY
        $this->assertSame('ON_DELIVERY', $recentOrder->fresh()->status);
        $this->assertNull($recentOrder->fresh()->completed_by);

        // Verify Order 2 changed to COMPLETED with SYSTEM_TIMEOUT
        $refreshedExpired = $expiredOrder->fresh();
        $this->assertSame('COMPLETED', $refreshedExpired->status);
        $this->assertSame('SYSTEM_TIMEOUT', $refreshedExpired->completed_by);
        $this->assertNotNull($refreshedExpired->customer_confirmed_at);
    }
}
