<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Order\Services\PaymentFeeCalculator;
use Modules\Product\Models\Product;
use Tests\TestCase;

class PaymentChannelFeeTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        Http::fake(['*/snap/v1/transactions' => Http::response(['token' => 'SNAP-TEST', 'redirect_url' => 'https://snap.test/x'], 201)]);

        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01', 'branch_id' => $branch->id, 'name' => 'Plant Pangkep',
            'lat' => -4.783, 'lng' => 119.557, 'status' => 'OPERATIONAL', 'is_active' => true,
        ]);
        $product = Product::query()->create([
            'code' => 'ST-OPC-50KG', 'name' => 'Semen OPC', 'category' => 'cement', 'unit' => 'Sak',
            'base_price' => 78000, 'min_order' => 20, 'is_active' => true,
        ]);
        $this->token = Customer::query()->create([
            'name' => 'Pelanggan', 'phone' => '081300000099', 'password' => 'password', 'is_active' => true,
        ])->createToken('mobile')->plainTextToken;

        $uuid = $this->withToken($this->token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Gudang', 'delivery_address' => 'Jl. Poros', 'delivery_lat' => -4.805, 'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS', 'items' => [['product_uuid' => $product->uuid, 'quantity' => 100]],
        ])->assertCreated()->json('data.uuid');

        $this->order = Order::query()->where('uuid', $uuid)->firstOrFail();
        $this->order->update(['status' => 'CONFIRMED', 'approved_at' => now()]);
    }

    public function test_fee_formula_grosses_up_percentage_and_rounds_up(): void
    {
        $calc = app(PaymentFeeCalculator::class);

        $this->assertSame(['admin_fee' => 4000.0, 'total_price' => 1004000.0], $calc->quote(1000000, 0, 4000));

        // Kartu kredit 2,9% + Rp2.000: dana bersih setelah dipotong Midtrans tetap ≥ nominal dasar
        $cc = $calc->quote(1000000, 2.9, 2000);
        $this->assertGreaterThanOrEqual(1000000, $cc['total_price'] - ($cc['total_price'] * 0.029 + 2000));
        $this->assertSame(floor($cc['total_price']), $cc['total_price']);
    }

    public function test_payment_options_list_total_per_method(): void
    {
        $res = $this->withToken($this->token)->getJson("/api/customer/v1/orders/{$this->order->uuid}/payment-options")->assertOk();

        $totals = collect($res->json('data.options'))->pluck('total', 'code');
        $base = app(PaymentFeeCalculator::class)->baseAmount($this->order->fresh());

        $this->assertEquals(ceil($base + 4000), $totals['bca_va']);
        $this->assertGreaterThan($totals['qris'], $totals['credit_card']);
        $this->assertArrayNotHasKey('fee', $res->json('data.options.0'));
    }

    public function test_paying_with_channel_applies_fee_and_restricts_snap_method(): void
    {
        $res = $this->withToken($this->token)
            ->postJson("/api/customer/v1/orders/{$this->order->uuid}/pay", ['channel' => 'credit_card'])
            ->assertOk()
            ->assertJsonPath('data.payment_channel', 'credit_card')
            ->assertJsonPath('data.payment_channel_label', 'Kartu Kredit / Debit Online');

        $order = $this->order->fresh();
        $expected = app(PaymentFeeCalculator::class)->quoteForChannel($order, 'credit_card');
        $this->assertEquals($expected['total_price'], (float) $order->total_price);
        $this->assertEquals($expected['total_price'], (float) $res->json('data.total_price'));

        Http::assertSent(fn (HttpRequest $req) => $req['enabled_payments'] === ['credit_card']
            && $req['transaction_details']['gross_amount'] === (int) $expected['total_price']);

        // Ganti metode → nominal turun & token Snap baru dibuat
        $this->withToken($this->token)
            ->postJson("/api/customer/v1/orders/{$this->order->uuid}/pay", ['channel' => 'bca_va'])
            ->assertOk();
        Http::assertSent(fn (HttpRequest $req) => $req['enabled_payments'] === ['bca_va']);
        $this->assertLessThan($expected['total_price'], (float) $this->order->fresh()->total_price);
    }

    public function test_unknown_or_disabled_channel_is_rejected(): void
    {
        config(['services.midtrans.enabled_channels' => ['qris']]);

        $this->withToken($this->token)
            ->postJson("/api/customer/v1/orders/{$this->order->uuid}/pay", ['channel' => 'credit_card'])
            ->assertStatus(422);
    }
}
