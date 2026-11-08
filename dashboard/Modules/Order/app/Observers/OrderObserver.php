<?php

namespace Modules\Order\Observers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Order\Models\Order;
use Modules\Order\Services\OrderSalesContacts;
use Modules\Shared\Services\FonnteService;

class OrderObserver
{
    public function __construct(
        private FonnteService $fonnte,
        private OrderSalesContacts $salesContacts,
    ) {}

    public function created(Order $order): void
    {
        $this->notifySales($order);

        try {
            $message = $order->status === 'PENDING_APPROVAL'
                ? "Pesanan {$order->code} berhasil dibuat dan sedang menunggu verifikasi lokasi oleh tim sales. Rincian harga akan diinformasikan setelah pesanan disetujui."
                : "Pesanan {$order->code} berhasil dibuat. Status: {$this->label($order->status)}.";
            $this->fonnte->send((string) $order->customer_phone, $message);

            $admin = config('services.fonnte.admin_phone');
            if (is_string($admin) && trim($admin) !== '') {
                $adminPhones = array_filter(array_map('trim', explode(',', $admin)));
                foreach ($adminPhones as $adminPhone) {
                    $this->fonnte->send($adminPhone, "Pesanan baru {$order->code} dari {$order->customer_name}. Status: {$this->label($order->status)}.");
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Gagal mengantri notifikasi WhatsApp pesanan baru: '.$e->getMessage());
        }
    }

    /**
     * Notifikasi WA ke sales plant untuk survei lokasi pesanan baru dari aplikasi customer.
     * Dijalankan setelah transaksi commit agar item pesanan sudah tersimpan.
     */
    private function notifySales(Order $order): void
    {
        if ($order->status !== 'PENDING_APPROVAL') {
            return;
        }

        DB::afterCommit(function () use ($order): void {
            try {
                $order = $order->fresh(['items.product', 'batchingPlant']);
                if (! $order) {
                    return;
                }

                foreach ($this->salesContacts->forOrder($order) as $contact) {
                    $this->fonnte->send($contact['whatsapp'], $this->salesSurveyMessage($order));
                }
            } catch (\Throwable $e) {
                Log::warning('Gagal mengantri notifikasi WhatsApp ke sales: '.$e->getMessage());
            }
        });
    }

    private function salesSurveyMessage(Order $order): string
    {
        $plantName = $order->batchingPlant?->name ?? 'Batching Plant';
        $createdAt = $order->created_at?->copy()->timezone('Asia/Makassar')->format('d/m/Y H:i').' WITA';

        $items = $order->items->map(function ($item): string {
            $q = (float) $item->quantity;
            $qty = floor($q) === $q
                ? number_format($q, 0, ',', '.')
                : rtrim(number_format($q, 2, ',', '.'), '0');

            return '• '.($item->product?->name ?? 'Produk')." — {$qty} {$item->unit}";
        })->implode("\n");

        $hasCoords = $order->delivery_lat !== null && $order->delivery_lng !== null;
        $mapsUrl = $hasCoords
            ? "https://www.google.com/maps/search/?api=1&query={$order->delivery_lat},{$order->delivery_lng}"
            : null;
        $appUrl = rtrim((string) config('services.mobile_app.url'), '/')."/sales/orders/{$order->uuid}";

        $lines = [
            '🔔 *PESANAN BARU — PERLU SURVEI LOKASI*',
            '',
            "Halo Tim Sales *{$plantName}*,",
            'Ada pesanan baru yang menunggu verifikasi lokasi dari Anda.',
            '',
            "📄 *No. Pesanan:* {$order->code}",
            "🗓️ *Masuk:* {$createdAt}",
            "👤 *Pelanggan:* {$order->customer_name}",
        ];
        if ($order->customer_phone) {
            $lines[] = "📞 *Kontak:* {$order->customer_phone}";
        }
        $lines[] = "🏗️ *Proyek:* {$order->project_title}";

        if ($items !== '') {
            $lines[] = '';
            $lines[] = '📦 *Material:*';
            $lines[] = $items;
        }

        $lines[] = '';
        $lines[] = '📍 *Lokasi Pengantaran:*';
        $lines[] = (string) $order->delivery_address;
        if ($mapsUrl) {
            $lines[] = "🗺️ {$mapsUrl}";
        }
        if ((float) $order->distance_km > 0) {
            $lines[] = '📏 Jarak dari plant: '.number_format((float) $order->distance_km, 1, ',', '.').' km';
        }

        if (filled($order->notes)) {
            $lines[] = '';
            $lines[] = "📝 *Catatan Pelanggan:* {$order->notes}";
        }

        array_push(
            $lines,
            '',
            '✅ *Mohon segera:*',
            '1. Survei akses jalan & area bongkar truk mixer',
            '2. Setujui atau tolak pesanan melalui aplikasi sales:',
            $appUrl,
            '',
            'Terima kasih atas respons cepatnya 🙏',
            '_PT Prima Karya Manunggal — Semen Tonasa Group_',
        );

        return implode("\n", $lines);
    }

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        try {
            $this->fonnte->send(
                (string) $order->customer_phone,
                "Status pesanan {$order->code} berubah menjadi {$this->label($order->status)}.",
            );
        } catch (\Throwable $e) {
            Log::warning('Gagal mengantri notifikasi WhatsApp perubahan status: '.$e->getMessage());
        }
    }

    private function label(?string $status): string
    {
        return match ($status) {
            'CONFIRMED' => 'Dikonfirmasi',
            'PROCESSING', 'WORK_ORDER_CREATED', 'IN_PRODUCTION' => 'Diproses',
            'ON_DELIVERY', 'PARTIAL_DELIVERY' => 'Dalam Pengiriman',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '',
        };
    }
}
