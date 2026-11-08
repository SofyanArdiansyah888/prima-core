<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Customer\Models\Customer;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\Shared\Jobs\SendWhatsappMessage;
use Tests\TestCase;

class OrderWhatsappMessagesTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(): Order
    {
        $branch = Branch::query()->create(['code' => 'BR-SULSEL-01', 'name' => 'Sulawesi Selatan', 'is_active' => true]);
        BatchingPlant::query()->create([
            'code' => 'BR-SULSEL-01-BP-01',
            'branch_id' => $branch->id,
            'name' => 'Batching Plant Pangkep',
            'lat' => -4.783,
            'lng' => 119.557,
            'whatsapp' => '6281299990001',
            'status' => 'OPERATIONAL',
            'is_active' => true,
        ]);
        $product = Product::query()->create([
            'code' => 'ST-OPC-50KG',
            'name' => 'Semen Tonasa OPC',
            'category' => 'cement',
            'unit' => 'Sak',
            'base_price' => 78000,
            'min_order' => 20,
            'is_active' => true,
        ]);
        $token = Customer::query()->create([
            'name' => 'Andi Wijaya',
            'phone' => '081300000099',
            'password' => 'password',
            'is_active' => true,
        ])->createToken('mobile')->plainTextToken;

        $res = $this->withToken($token)->postJson('/api/customer/v1/orders', [
            'project_title' => 'Gudang Semen',
            'delivery_address' => 'Jl. Poros Tonasa II No. 10',
            'delivery_lat' => -4.805,
            'delivery_lng' => 119.561,
            'payment_method' => 'MIDTRANS',
            'items' => [['product_uuid' => $product->uuid, 'quantity' => 100]],
        ])->assertCreated();

        return Order::query()->where('code', $res->json('data.code'))->firstOrFail();
    }

    /**
     * @return array<int, string>
     */
    private function customerMessages(): array
    {
        $messages = [];
        Queue::assertPushed(SendWhatsappMessage::class, function ($job) use (&$messages) {
            if ($job->phone === '081300000099') {
                $messages[] = $job->message;
            }

            return true;
        });

        return $messages;
    }

    public function test_customer_receives_professional_message_for_each_order_stage(): void
    {
        Queue::fake();
        $order = $this->placeOrder();

        $created = $this->customerMessages()[0];
        $this->assertStringContainsString('*Pesanan Berhasil Diterima*', $created);
        $this->assertStringContainsString('Yth. Bapak/Ibu *Andi Wijaya*', $created);
        $this->assertStringContainsString('• Semen Tonasa OPC — 100 Sak', $created);
        $this->assertStringContainsString('/orders/'.$order->uuid, $created);
        $this->assertStringNotContainsString('Rp', $created);
        $this->assertStringContainsString('Salam hormat,', $created);

        $order->update(['status' => 'CONFIRMED', 'approved_at' => now(), 'survey_notes' => 'Akses jalan lebar, aman untuk truk.']);
        $approved = last($this->customerMessages());
        $this->assertStringContainsString('*Pesanan Disetujui*', $approved);
        $this->assertStringContainsString('Akses jalan lebar', $approved);
        $this->assertStringContainsString('Total Tagihan', $approved);
        $this->assertStringContainsString('selesaikan pembayaran', $approved);

        $order->update(['payment_status' => 'PAID', 'paid_at' => now(), 'midtrans_payment_type' => 'qris']);
        $paid = last($this->customerMessages());
        $this->assertStringContainsString('*Pembayaran Berhasil Diterima*', $paid);
        $this->assertStringContainsString('Midtrans (QRIS)', $paid);

        $order->update(['status' => 'ON_DELIVERY']);
        $this->assertStringContainsString('*Armada Dalam Perjalanan*', last($this->customerMessages()));

        $order->update(['status' => 'COMPLETED']);
        $this->assertStringContainsString('*Pesanan Selesai*', last($this->customerMessages()));
    }

    public function test_cancellation_message_includes_reason_and_refund(): void
    {
        Queue::fake();
        $order = $this->placeOrder();

        $order->update([
            'status' => 'CANCELLED',
            'cancellation_reason' => 'Akses jalan tidak dapat dilalui truk mixer.',
            'payment_status' => 'REFUNDED',
            'refund_amount' => 500000,
        ]);

        $messages = $this->customerMessages();
        $cancelled = last($messages);
        $this->assertStringContainsString('*Pesanan Dibatalkan*', $cancelled);
        $this->assertStringContainsString('Akses jalan tidak dapat dilalui', $cancelled);
        $this->assertStringContainsString('Rp 500.000', $cancelled);
        $this->assertStringContainsString('wa.me/6281299990001', $cancelled);
        // Tidak ada pesan refund terpisah saat pembatalan + refund terjadi bersamaan
        $this->assertCount(2, $messages);
    }
}
