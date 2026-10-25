<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Tests\TestCase;

class OrderSiteVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function setupData(): array
    {
        $branch = Branch::query()->create([
            'code' => 'BR-001',
            'name' => 'Cabang Sulsel',
            'is_active' => true,
        ]);

        $plant = BatchingPlant::query()->create([
            'branch_id' => $branch->id,
            'code' => 'PL-PKP',
            'name' => 'Plant Pangkep',
            'latitude' => -4.8000,
            'longitude' => 119.5500,
            'is_active' => true,
        ]);

        $salesUser = User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'admin',
        ]);
        $salesUser->batchingPlants()->attach($plant->id);

        $customer = Customer::query()->create([
            'name' => 'Pelanggan Proyek',
            'phone' => '081234567890',
            'password' => 'password',
            'is_active' => true,
        ]);

        $product = Product::query()->create([
            'code' => 'RM-K300',
            'name' => 'Beton Ready Mix K-300 NFA',
            'category' => 'readymix',
            'unit' => 'M3',
            'base_price' => 850000,
            'min_order' => 1,
            'is_active' => true,
        ]);

        $order = Order::query()->create([
            'code' => 'ORD-TEST-001',
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'customer_type' => 'B2C',
            'batching_plant_id' => $plant->id,
            'project_title' => 'Pembangunan Ruko 3 Lantai',
            'delivery_address' => 'Jl. Poros Desa Biringere, Pangkep',
            'delivery_lat' => -4.8050,
            'delivery_lng' => 119.5550,
            'status' => 'PENDING_APPROVAL',
            'payment_status' => 'PENDING',
            'payment_method' => 'MIDTRANS',
            'subtotal' => 2550000,
            'delivery_fee' => 100000,
            'distance_km' => 3.5,
            'ppn' => 280500,
            'admin_fee' => 4500,
            'total_price' => 2935000,
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 3,
            'unit' => 'M3',
            'unit_price' => 850000,
            'subtotal' => 2550000,
        ]);

        return compact('salesUser', 'customer', 'plant', 'product', 'order');
    }

    public function test_sales_can_approve_order_and_adjust_pin_location_for_heavy_trucks(): void
    {
        ['salesUser' => $salesUser, 'order' => $order] = $this->setupData();

        $this->actingAs($salesUser);

        $adjustedLat = -4.8100;
        $adjustedLng = 119.5600;
        $adjustedAddress = 'Jl. Poros Desa Biringere (Pintu Masuk Barat Akses Truk Tronton), Pangkep';
        $surveyNotes = 'Jalan masuk utama kabel terlalu rendah; dialihkan lewat gerbang barat yang aman untuk truk mixer.';

        $response = $this->post(route('orders.approve', $order), [
            'delivery_lat' => $adjustedLat,
            'delivery_lng' => $adjustedLng,
            'delivery_address' => $adjustedAddress,
            'survey_notes' => $surveyNotes,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order->refresh();

        $this->assertSame('CONFIRMED', $order->status);
        $this->assertNotNull($order->approved_at);
        $this->assertSame($salesUser->id, $order->approved_by_id);
        $this->assertSame($surveyNotes, $order->survey_notes);
        $this->assertSame($adjustedAddress, $order->delivery_address);
        $this->assertEquals($adjustedLat, (float) $order->delivery_lat);
        $this->assertEquals($adjustedLng, (float) $order->delivery_lng);
    }

    public function test_sales_can_reject_order_if_site_inaccessible_for_big_trucks(): void
    {
        ['salesUser' => $salesUser, 'order' => $order] = $this->setupData();

        $this->actingAs($salesUser);

        $reason = 'Gang sempit kurang dari 2.5 meter dan terdapat jembatan kayu beban maks 3 ton. Tidak bisa dilalui armada mixer tonasa.';

        $response = $this->post(route('orders.reject', $order), [
            'rejection_reason' => $reason,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order->refresh();

        $this->assertSame('CANCELLED', $order->status);
        $this->assertSame($reason, $order->rejection_reason);
    }
}
