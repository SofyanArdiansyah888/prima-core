<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Banner\Models\Banner;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\DeliveryRate\Models\PlantDeliveryRate;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

class MasterDeleteProtectionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);
    }

    public function test_branch_cannot_be_deleted_if_plant_has_transactions(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-01',
            'name' => 'Cabang Test Transaksi',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-01-BP-01',
            'name' => 'Plant Test Trx',
            'is_active' => true,
        ]);

        Order::query()->create([
            'code' => 'ORD-TRX-001',
            'customer_name' => 'Customer Test',
            'project_title' => 'Project Test',
            'delivery_address' => 'Jl. Test No. 1',
            'batching_plant_id' => $plant->id,
            'distance_km' => 5,
            'delivery_fee' => 50000,
            'subtotal' => 500000,
            'ppn' => 55000,
            'total_price' => 605000,
            'status' => 'CONFIRMED',
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/branches/{$branch->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('branches', ['id' => $branch->id]);
    }

    public function test_branch_cannot_be_deleted_if_it_still_has_plants(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-02',
            'name' => 'Cabang Ada Plant',
            'is_active' => true,
        ]);

        BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-02-BP-01',
            'name' => 'Plant Tanpa Trx',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/branches/{$branch->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('branches', ['id' => $branch->id]);
    }

    public function test_clean_branch_can_be_deleted(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-03',
            'name' => 'Cabang Bersih',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/branches/{$branch->uuid}");

        $response->assertRedirect('/master/branches');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
    }

    public function test_batching_plant_cannot_be_deleted_if_it_has_orders(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-04',
            'name' => 'Cabang Plant Trx',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-04-BP-01',
            'name' => 'Plant Berorder',
            'is_active' => true,
        ]);

        Order::query()->create([
            'code' => 'ORD-TRX-002',
            'customer_name' => 'Customer Plant',
            'project_title' => 'Project Plant',
            'delivery_address' => 'Jl. Plant No. 1',
            'batching_plant_id' => $plant->id,
            'total_price' => 100000,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/batching-plants/{$plant->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('batching_plants', ['id' => $plant->id]);
    }

    public function test_clean_batching_plant_can_be_deleted(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-05',
            'name' => 'Cabang Plant Bersih',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-05-BP-01',
            'name' => 'Plant Bersih',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/batching-plants/{$plant->uuid}");

        $response->assertRedirect('/master/batching-plants');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('batching_plants', ['id' => $plant->id]);
    }

    public function test_product_cannot_be_deleted_if_used_in_order_items(): void
    {
        $product = Product::query()->create([
            'code' => 'PRD-TEST-01',
            'name' => 'Beton K-300 Test',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 850000,
            'is_active' => true,
        ]);

        $order = Order::query()->create([
            'code' => 'ORD-PRD-001',
            'customer_name' => 'Customer Product',
            'project_title' => 'Project Product',
            'delivery_address' => 'Jl. Product No. 1',
            'total_price' => 850000,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 850000,
            'subtotal' => 850000,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/products/{$product->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_clean_product_can_be_deleted(): void
    {
        $product = Product::query()->create([
            'code' => 'PRD-TEST-02',
            'name' => 'Beton Bersih Test',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 500000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/products/{$product->uuid}");

        $response->assertRedirect('/master/products');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_product_category_cannot_be_deleted_if_products_inside_have_transactions(): void
    {
        $category = ProductCategory::query()->create([
            'code' => 'CAT-TEST-01',
            'name' => 'Kategori Trx Test',
            'slug' => 'cat-trx-test',
            'default_unit' => 'm³',
            'is_active' => true,
        ]);

        $product = Product::query()->create([
            'category_id' => $category->id,
            'code' => 'PRD-CAT-01',
            'name' => 'Produk Dalam Kategori',
            'category' => $category->slug,
            'unit' => 'm³',
            'base_price' => 700000,
            'is_active' => true,
        ]);

        $order = Order::query()->create([
            'code' => 'ORD-CAT-001',
            'customer_name' => 'Customer Cat',
            'project_title' => 'Project Cat',
            'delivery_address' => 'Jl. Cat No. 1',
            'total_price' => 700000,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 700000,
            'subtotal' => 700000,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/product-categories/{$category->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('product_categories', ['id' => $category->id]);
    }

    public function test_clean_product_category_can_be_deleted(): void
    {
        $category = ProductCategory::query()->create([
            'code' => 'CAT-TEST-02',
            'name' => 'Kategori Bersih Test',
            'slug' => 'cat-bersih-test',
            'default_unit' => 'Sak',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/product-categories/{$category->uuid}");

        $response->assertRedirect('/master/product-categories');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('product_categories', ['id' => $category->id]);
    }

    public function test_user_cannot_delete_own_account(): void
    {
        $response = $this->actingAs($this->admin)->delete("/master/users/{$this->admin->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_user_cannot_be_deleted_if_assigned_to_work_order(): void
    {
        $operator = User::factory()->create([
            'role' => 'user',
            'name' => 'Operator Trx',
        ]);

        $branch = Branch::query()->create([
            'code' => 'BR-TEST-06',
            'name' => 'Cabang WO',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-06-BP-01',
            'name' => 'Plant WO',
            'is_active' => true,
        ]);

        $order = Order::query()->create([
            'code' => 'ORD-WO-001',
            'customer_name' => 'Customer WO',
            'project_title' => 'Project WO',
            'delivery_address' => 'Jl. WO No. 1',
            'total_price' => 500000,
        ]);

        WorkOrder::query()->create([
            'code' => 'SPK-WO-001',
            'order_id' => $order->id,
            'batching_plant_id' => $plant->id,
            'assigned_user_id' => $operator->id,
            'scheduled_date' => now()->toDateString(),
            'target_quantity' => 10,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/users/{$operator->uuid}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $operator->id]);
    }

    public function test_clean_user_can_be_deleted(): void
    {
        $operator = User::factory()->create([
            'role' => 'user',
            'name' => 'Operator Bersih',
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/users/{$operator->uuid}");

        $response->assertRedirect('/master/users');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('users', ['id' => $operator->id]);
    }

    public function test_banner_can_be_deleted_and_cleans_up_storage(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('banners/test_banner.jpg', 'image content');

        $banner = Banner::query()->create([
            'code' => 'BNR-TEST-01',
            'badge' => 'Promo',
            'title' => 'Banner Test Hapus',
            'cta_label' => 'Lihat',
            'image_path' => 'banners/test_banner.jpg',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/banners/{$banner->uuid}");

        $response->assertRedirect('/master/banners');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('banners', ['id' => $banner->id]);
        Storage::disk('public')->assertMissing('banners/test_banner.jpg');
    }

    public function test_delivery_rate_can_be_deleted(): void
    {
        $branch = Branch::query()->create([
            'code' => 'BR-TEST-07',
            'name' => 'Cabang Rate',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'BR-TEST-07-BP-01',
            'name' => 'Plant Rate',
            'is_active' => true,
        ]);

        $rate = PlantDeliveryRate::query()->create([
            'batching_plant_id' => $plant->id,
            'min_distance_km' => 0,
            'max_distance_km' => 10,
            'base_fee' => 100000,
            'cost_per_km_unit' => 5000,
            'min_charge' => 100000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/master/delivery-rates/{$rate->uuid}");

        $response->assertRedirect('/master/delivery-rates');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('plant_delivery_rates', ['id' => $rate->id]);
    }
}
