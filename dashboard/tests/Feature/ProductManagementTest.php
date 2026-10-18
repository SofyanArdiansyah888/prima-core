<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        return $user;
    }

    public function test_admin_can_create_product_with_image_and_featured_flags(): void
    {
        Storage::fake('public');
        $admin = $this->adminUser();

        $category = ProductCategory::query()->create([
            'code' => 'CAT-RM',
            'name' => 'Ready Mix Test',
            'slug' => 'readymix-test',
            'default_unit' => 'm³',
            'is_active' => true,
        ]);

        $image = UploadedFile::fake()->image('product.jpg', 600, 600);

        $response = $this->actingAs($admin)->post('/master/products', [
            'name' => 'Beton Super Mutu K-400',
            'category' => $category->slug,
            'unit' => 'm³',
            'base_price' => 950000,
            'max_trip_capacity' => 7,
            'allow_combined_delivery' => false,
            'min_order' => 3,
            'is_featured' => true,
            'is_best_seller' => true,
            'image' => $image,
        ]);

        $response->assertRedirect('/master/products');
        $this->assertDatabaseHas('products', [
            'name' => 'Beton Super Mutu K-400',
            'is_featured' => true,
            'is_best_seller' => true,
        ]);

        $product = Product::query()->where('name', 'Beton Super Mutu K-400')->firstOrFail();
        $this->assertNotNull($product->image_path);
        Storage::disk('public')->assertExists($product->image_path);
        $this->assertStringContainsString('/storage/products/', $product->imageUrl());
    }

    public function test_admin_can_update_product_and_replace_image(): void
    {
        Storage::fake('public');
        $admin = $this->adminUser();

        $category = ProductCategory::query()->create([
            'code' => 'CAT-CM',
            'name' => 'Cement Test',
            'slug' => 'cement-test',
            'default_unit' => 'Sak',
            'is_active' => true,
        ]);

        $oldImage = UploadedFile::fake()->image('old.jpg');
        $oldPath = $oldImage->store('products', 'public');

        $product = Product::query()->create([
            'code' => 'TEST-001',
            'name' => 'Semen Uji',
            'category' => $category->slug,
            'category_id' => $category->id,
            'unit' => 'Sak',
            'base_price' => 75000,
            'max_trip_capacity' => 200,
            'allow_combined_delivery' => true,
            'min_order' => 10,
            'image_path' => $oldPath,
            'is_active' => true,
            'is_featured' => false,
            'is_best_seller' => false,
        ]);

        $newImage = UploadedFile::fake()->image('new.jpg');

        $response = $this->actingAs($admin)->put("/master/products/{$product->uuid}", [
            'name' => 'Semen Uji Diperbarui',
            'category' => $category->slug,
            'unit' => 'Sak',
            'base_price' => 80000,
            'max_trip_capacity' => 200,
            'allow_combined_delivery' => true,
            'min_order' => 10,
            'is_active' => true,
            'is_featured' => true,
            'is_best_seller' => false,
            'image' => $newImage,
        ]);

        $response->assertRedirect('/master/products');
        $product->refresh();

        $this->assertSame('Semen Uji Diperbarui', $product->name);
        $this->assertTrue($product->is_featured);
        $this->assertFalse($product->is_best_seller);
        $this->assertNotSame($oldPath, $product->image_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($product->image_path);
    }
}
