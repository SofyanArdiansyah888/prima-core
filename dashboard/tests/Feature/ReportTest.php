<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Branch $branch;
    private BatchingPlant $plant;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->branch = Branch::query()->create([
            'code' => 'BR-SULSEL-01',
            'name' => 'Cabang Makassar',
            'is_active' => true,
        ]);

        $this->plant = BatchingPlant::query()->create([
            'branch_id' => $this->branch->id,
            'code' => 'BR-SULSEL-01-BP-01',
            'name' => 'Plant Panakkukang',
            'is_active' => true,
        ]);

        $this->product = Product::query()->create([
            'code' => 'RM-K225',
            'name' => 'Ready Mix K-225',
            'category' => 'readymix',
            'unit' => 'm³',
            'base_price' => 840000,
            'max_trip_capacity' => 7.00,
            'allow_combined_delivery' => false,
            'min_order' => 1,
            'is_active' => true,
        ]);

        // Seed an order
        $order = Order::query()->create([
            'code' => 'ORD-RPT-001',
            'customer_name' => 'PT Semen Maju',
            'project_title' => 'Pembangunan Ruko',
            'delivery_address' => 'Jl. Urip Sumoharjo No. 10',
            'batching_plant_id' => $this->plant->id,
            'distance_km' => 4,
            'delivery_fee' => 100000,
            'subtotal' => 840000 * 7,
            'ppn' => 840000 * 7 * 0.11,
            'total_price' => 840000 * 7 * 1.11 + 100000,
            'payment_status' => 'PAID',
            'status' => 'PROCESSING',
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 7.00,
            'fulfilled_quantity' => 0,
            'unit_price' => 840000,
            'subtotal' => 840000 * 7,
        ]);

        // Seed a work order
        $wo = WorkOrder::query()->create([
            'code' => 'WO-RPT-001',
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'batching_plant_id' => $this->plant->id,
            'scheduled_date' => now()->toDateString(),
            'scheduled_time_slot' => 'Pagi (08:00 - 12:00)',
            'target_quantity' => 7.00,
            'produced_quantity' => 7.00,
            'dispatched_quantity' => 7.00,
            'unit' => 'm³',
            'status' => 'SCHEDULED',
        ]);

        // Seed a surat jalan
        $sj = SuratJalan::query()->create([
            'code' => 'SJ-RPT-001',
            'batching_plant_id' => $this->plant->id,
            'vehicle_number' => 'DD 7777 AB',
            'vehicle_type' => 'MIXER_TRUCK_7M3',
            'driver_name' => 'Daeng Udin',
            'status' => 'ON_THE_WAY',
            'departure_time' => now(),
        ]);

        SuratJalanItem::query()->create([
            'surat_jalan_id' => $sj->id,
            'order_id' => $order->id,
            'work_order_id' => $wo->id,
            'product_id' => $this->product->id,
            'quantity_delivered' => 7.00,
            'unit' => 'm³',
            'destination_customer_name' => $order->customer_name,
            'destination_project_title' => $order->project_title,
            'destination_address' => $order->delivery_address,
            'delivery_sequence' => 1,
            'status' => 'ON_TRUCK',
        ]);
    }

    public function test_sales_report_page_renders_successfully(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/penjualan');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('modules/report/index')
            ->where('kind', 'sales')
            ->has('metrics', 4)
            ->has('records')
            ->has('filters')
        );
    }

    public function test_production_report_page_renders_successfully(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/produksi');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('modules/report/index')
            ->where('kind', 'production')
            ->has('metrics', 4)
            ->has('records')
        );
    }

    public function test_dispatch_report_page_renders_successfully(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/distribusi');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('modules/report/index')
            ->where('kind', 'dispatch')
            ->has('metrics', 4)
            ->has('records')
        );
    }

    public function test_sales_excel_download_returns_binary_response(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/penjualan/excel');

        $response->assertOk();
        $this->assertStringContainsString('laporan-penjualan-', (string) $response->headers->get('content-disposition'));
    }

    public function test_production_excel_download_returns_binary_response(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/produksi/excel');

        $response->assertOk();
        $this->assertStringContainsString('laporan-produksi-', (string) $response->headers->get('content-disposition'));
    }

    public function test_dispatch_excel_download_returns_binary_response(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/distribusi/excel');

        $response->assertOk();
        $this->assertStringContainsString('laporan-distribusi-', (string) $response->headers->get('content-disposition'));
    }

    public function test_sales_pdf_download_returns_pdf_document(): void
    {
        $response = $this->actingAs($this->admin)->get('/laporan/penjualan/pdf');

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }
}
