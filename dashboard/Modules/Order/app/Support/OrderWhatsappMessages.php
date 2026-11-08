<?php

namespace Modules\Order\Support;

use Illuminate\Support\Carbon;
use Modules\Order\Models\Order;

/**
 * Template pesan WhatsApp pesanan dengan format seragam & profesional.
 *
 * Konvensi format WhatsApp: *tebal*, _miring_. Semua waktu ditampilkan dalam WITA.
 */
class OrderWhatsappMessages
{
    private const COMPANY = 'PT Prima Karya Manunggal';

    private const GROUP = 'Semen Tonasa Group';

    // ---------------------------------------------------------------------
    // Customer
    // ---------------------------------------------------------------------

    public function customerOrderCreated(Order $order): string
    {
        if ($order->status !== 'PENDING_APPROVAL') {
            return $this->compose([
                '✅ *Pesanan Terkonfirmasi*',
                '',
                $this->greeting($order),
                'Terima kasih atas kepercayaan Anda. Pesanan Anda telah kami terima dan terkonfirmasi.',
                '',
                ...$this->orderSummary($order),
                '',
                ...$this->costBreakdown($order),
                '',
                '🔎 *Pantau status pesanan:*',
                $this->customerOrderUrl($order),
            ]);
        }

        return $this->compose([
            '✅ *Pesanan Berhasil Diterima*',
            '',
            $this->greeting($order),
            'Terima kasih telah memesan di '.self::COMPANY.'. Pesanan Anda sudah kami terima dengan rincian berikut:',
            '',
            ...$this->orderSummary($order),
            '',
            '⏳ *Langkah Berikutnya*',
            'Tim sales kami akan memverifikasi lokasi dan akses armada truk ke proyek Anda. Rincian harga beserta tautan pembayaran akan kami kirimkan setelah pesanan disetujui.',
            '',
            '🔎 *Pantau status pesanan:*',
            $this->customerOrderUrl($order),
        ]);
    }

    public function customerStatusChanged(Order $order): string
    {
        return match ($order->status) {
            'CONFIRMED' => $this->customerApproved($order),
            'PROCESSING', 'WORK_ORDER_CREATED', 'IN_PRODUCTION' => $this->customerProcessing($order),
            'ON_DELIVERY', 'PARTIAL_DELIVERY' => $this->customerOnDelivery($order),
            'COMPLETED' => $this->customerCompleted($order),
            'CANCELLED' => $this->customerCancelled($order),
            default => $this->compose([
                'ℹ️ *Pembaruan Status Pesanan*',
                '',
                $this->greeting($order),
                "Status pesanan *{$order->code}* kini: *".OrderStatusLabel::for($order->status).'*.',
                '',
                '🔎 *Detail pesanan:*',
                $this->customerOrderUrl($order),
            ]),
        };
    }

    public function customerPaymentReceived(Order $order): string
    {
        $paidAt = $order->paid_at ? $this->time($order->paid_at) : $this->time(now());

        return $this->compose([
            '💳 *Pembayaran Berhasil Diterima*',
            '',
            $this->greeting($order),
            "Terima kasih, pembayaran untuk pesanan *{$order->code}* telah kami terima.",
            '',
            '💰 *Jumlah:* '.$this->money($order->total_price),
            '🧾 *Metode:* '.$this->paymentMethod($order),
            "🗓️ *Waktu:* {$paidAt}",
            '',
            'Pesanan Anda akan segera kami jadwalkan untuk produksi dan pengiriman. Kami akan mengabari Anda pada setiap tahap berikutnya.',
            '',
            '🔎 *Detail pesanan & faktur:*',
            $this->customerOrderUrl($order),
        ]);
    }

    public function customerRefunded(Order $order): string
    {
        $lines = [
            '↩️ *Pengembalian Dana Diproses*',
            '',
            $this->greeting($order),
            "Pengembalian dana untuk pesanan *{$order->code}* telah kami proses.",
            '',
            '💰 *Nominal Refund:* '.$this->money($order->refund_amount),
        ];
        if (filled($order->refund_reference)) {
            $lines[] = "🧾 *Referensi:* {$order->refund_reference}";
        }
        array_push(
            $lines,
            '',
            'Dana akan diterima sesuai ketentuan metode pembayaran yang Anda gunakan. Silakan hubungi kami bila ada pertanyaan.',
        );

        return $this->compose($lines);
    }

    private function customerApproved(Order $order): string
    {
        $lines = [
            '🎉 *Pesanan Disetujui*',
            '',
            $this->greeting($order),
            "Kabar baik! Lokasi proyek untuk pesanan *{$order->code}* telah diverifikasi dan pesanan Anda *disetujui*.",
        ];

        if (filled($order->survey_notes)) {
            array_push($lines, '', "📝 *Catatan Survei:* {$order->survey_notes}");
        }

        array_push($lines, '', ...$this->costBreakdown($order));

        if (in_array($order->payment_status, ['PENDING', 'FAILED'], true)) {
            array_push(
                $lines,
                '',
                '💳 *Pembayaran*',
                'Silakan selesaikan pembayaran melalui aplikasi agar pesanan dapat segera kami jadwalkan untuk produksi:',
                $this->customerOrderUrl($order),
            );
        } else {
            array_push(
                $lines,
                '',
                'Pesanan Anda akan segera kami jadwalkan untuk produksi.',
                '',
                '🔎 *Detail pesanan:*',
                $this->customerOrderUrl($order),
            );
        }

        return $this->compose($lines);
    }

    private function customerProcessing(Order $order): string
    {
        return $this->compose([
            '🏭 *Pesanan Sedang Diproses*',
            '',
            $this->greeting($order),
            "Pesanan *{$order->code}* kini sedang dalam proses produksi di *{$this->plantName($order)}*.",
            '',
            'Kami akan mengabari Anda kembali saat armada berangkat menuju lokasi proyek. Mohon pastikan akses jalan dan area bongkar sudah siap.',
            '',
            '🔎 *Pantau status pesanan:*',
            $this->customerOrderUrl($order),
        ]);
    }

    private function customerOnDelivery(Order $order): string
    {
        $lines = [
            '🚚 *Armada Dalam Perjalanan*',
            '',
            $this->greeting($order),
            "Material pesanan *{$order->code}* sedang dalam perjalanan menuju lokasi proyek Anda.",
        ];

        $suratJalan = $this->latestSuratJalan($order);
        if ($suratJalan) {
            $lines[] = '';
            $lines[] = "📄 *Surat Jalan:* {$suratJalan->code}";
            if (filled($suratJalan->driver_name)) {
                $lines[] = "👷 *Supir:* {$suratJalan->driver_name}".(filled($suratJalan->driver_phone) ? " ({$suratJalan->driver_phone})" : '');
            }
            if (filled($suratJalan->vehicle_number)) {
                $lines[] = "🚛 *Kendaraan:* {$suratJalan->vehicle_number}";
            }
        }

        array_push(
            $lines,
            '',
            "📍 *Tujuan:* {$order->delivery_address}",
            '',
            'Mohon pastikan ada penerima di lokasi. Setelah material diterima dengan baik, silakan konfirmasi penerimaan melalui aplikasi:',
            $this->customerOrderUrl($order),
        );

        return $this->compose($lines);
    }

    private function customerCompleted(Order $order): string
    {
        return $this->compose([
            '🏁 *Pesanan Selesai*',
            '',
            $this->greeting($order),
            "Pesanan *{$order->code}* untuk proyek *{$order->project_title}* telah selesai.",
            '',
            'Terima kasih telah mempercayakan kebutuhan material Anda kepada kami. Semoga proyek Anda berjalan lancar dan sukses. Kami siap melayani pesanan Anda berikutnya.',
            '',
            '📂 *Dokumen pesanan (SPK, surat jalan, faktur):*',
            $this->customerOrderUrl($order),
        ]);
    }

    private function customerCancelled(Order $order): string
    {
        $reason = $order->cancellation_reason ?: $order->rejection_reason;

        $lines = [
            '❌ *Pesanan Dibatalkan*',
            '',
            $this->greeting($order),
            "Dengan berat hati kami informasikan bahwa pesanan *{$order->code}* telah dibatalkan.",
        ];
        if (filled($reason)) {
            array_push($lines, '', "📝 *Alasan:* {$reason}");
        }
        if ($order->payment_status === 'REFUNDED' && (float) $order->refund_amount > 0) {
            array_push(
                $lines,
                '',
                '💰 *Refund:* '.$this->money($order->refund_amount),
                'Dana akan dikembalikan sesuai ketentuan metode pembayaran yang Anda gunakan.',
            );
        }
        array_push(
            $lines,
            '',
            'Mohon maaf atas ketidaknyamanannya. Untuk informasi lebih lanjut atau membuat pesanan baru, silakan hubungi tim sales kami'
                .($this->plantWhatsapp($order) ? ' di wa.me/'.$this->plantWhatsapp($order) : '').'.',
        );

        return $this->compose($lines);
    }

    // ---------------------------------------------------------------------
    // Internal (sales & admin)
    // ---------------------------------------------------------------------

    public function salesSurvey(Order $order): string
    {
        $lines = [
            '🔔 *PESANAN BARU — PERLU SURVEI LOKASI*',
            '',
            "Halo Tim Sales *{$this->plantName($order)}*,",
            'Ada pesanan baru yang menunggu verifikasi lokasi dari Anda.',
            '',
            "📄 *No. Pesanan:* {$order->code}",
            '🗓️ *Masuk:* '.$this->time($order->created_at),
            "👤 *Pelanggan:* {$order->customer_name}",
        ];
        if ($order->customer_phone) {
            $lines[] = "📞 *Kontak:* {$order->customer_phone}";
        }
        $lines[] = "🏗️ *Proyek:* {$order->project_title}";

        $items = $this->itemLines($order);
        if ($items !== []) {
            array_push($lines, '', '📦 *Material:*', ...$items);
        }

        array_push($lines, '', ...$this->locationLines($order));

        if (filled($order->notes)) {
            array_push($lines, '', "📝 *Catatan Pelanggan:* {$order->notes}");
        }

        array_push(
            $lines,
            '',
            '✅ *Mohon segera:*',
            '1. Survei akses jalan & area bongkar truk mixer',
            '2. Setujui atau tolak pesanan melalui aplikasi sales:',
            $this->appUrl("/sales/orders/{$order->uuid}"),
            '',
            'Terima kasih atas respons cepatnya 🙏',
        );

        return $this->compose($lines, formal: false);
    }

    public function adminNewOrder(Order $order): string
    {
        $lines = [
            '📥 *Pesanan Baru Masuk*',
            '',
            "📄 *No. Pesanan:* {$order->code}",
            '🗓️ *Masuk:* '.$this->time($order->created_at),
            "👤 *Pelanggan:* {$order->customer_name}".($order->customer_phone ? " ({$order->customer_phone})" : ''),
            "🏗️ *Proyek:* {$order->project_title}",
            "🏭 *Plant:* {$this->plantName($order)}",
            '📌 *Status:* '.OrderStatusLabel::for($order->status),
        ];

        $items = $this->itemLines($order);
        if ($items !== []) {
            array_push($lines, '', '📦 *Material:*', ...$items);
        }

        array_push($lines, '', '💰 *Nilai Pesanan:* '.$this->money($order->total_price));

        return $this->compose($lines, formal: false);
    }

    // ---------------------------------------------------------------------
    // Building blocks
    // ---------------------------------------------------------------------

    /**
     * @param  array<int, string>  $lines
     */
    private function compose(array $lines, bool $formal = true): string
    {
        $footer = $formal
            ? ['', 'Salam hormat,', '*'.self::COMPANY.'*', '_'.self::GROUP.'_']
            : ['', '_'.self::COMPANY.' — '.self::GROUP.'_'];

        return implode("\n", [...$lines, ...$footer]);
    }

    private function greeting(Order $order): string
    {
        $name = trim((string) $order->customer_name) ?: 'Pelanggan';

        return "Yth. Bapak/Ibu *{$name}*,";
    }

    /**
     * @return array<int, string>
     */
    private function orderSummary(Order $order): array
    {
        $lines = [
            "📄 *No. Pesanan:* {$order->code}",
            "🏗️ *Proyek:* {$order->project_title}",
            "🏭 *Plant:* {$this->plantName($order)}",
        ];

        $items = $this->itemLines($order);
        if ($items !== []) {
            array_push($lines, '📦 *Material:*', ...$items);
        }

        $lines[] = "📍 *Lokasi:* {$order->delivery_address}";

        return $lines;
    }

    /**
     * @return array<int, string>
     */
    private function costBreakdown(Order $order): array
    {
        // Customer hanya melihat total (tanpa rincian PPN, ongkir, biaya layanan).
        $awaitingMethod = $order->payment_method === 'MIDTRANS'
            && $order->payment_channel === null
            && (float) $order->admin_fee <= 0
            && in_array($order->payment_status, ['PENDING', 'FAILED'], true);

        return [
            '💰 *Total Tagihan:* '.$this->money($order->total_price),
            $awaitingMethod
                ? '_Sudah termasuk pajak dan ongkos kirim. Biaya layanan pembayaran menyesuaikan metode yang Anda pilih di aplikasi._'
                : '_Sudah termasuk pajak dan ongkos kirim._',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function itemLines(Order $order): array
    {
        if (! $order->relationLoaded('items')) {
            $order->load('items.product');
        }

        return $order->items->map(function ($item): string {
            return '• '.($item->product?->name ?? 'Produk').' — '.$this->qty($item->quantity)." {$item->unit}";
        })->values()->all();
    }

    /**
     * @return array<int, string>
     */
    private function locationLines(Order $order): array
    {
        $lines = ['📍 *Lokasi Pengantaran:*', (string) $order->delivery_address];

        if ($order->delivery_lat !== null && $order->delivery_lng !== null) {
            $lines[] = '🗺️ https://www.google.com/maps/search/?api=1&query='.(float) $order->delivery_lat.','.(float) $order->delivery_lng;
        }
        if ((float) $order->distance_km > 0) {
            $lines[] = '📏 Jarak dari plant: '.number_format((float) $order->distance_km, 1, ',', '.').' km';
        }

        return $lines;
    }

    private function latestSuratJalan(Order $order): ?object
    {
        $order->loadMissing('suratJalanItems.suratJalan');

        return $order->suratJalanItems
            ->map(fn ($item) => $item->suratJalan)
            ->filter()
            ->sortByDesc('id')
            ->first();
    }

    private function plantName(Order $order): string
    {
        $order->loadMissing('batchingPlant');

        return $order->batchingPlant?->name ?? 'Batching Plant';
    }

    private function plantWhatsapp(Order $order): ?string
    {
        $order->loadMissing('batchingPlant');

        return $order->batchingPlant?->whatsapp ?: null;
    }

    private function paymentMethod(Order $order): string
    {
        $channelLabel = $order->payment_channel
            ? config("services.midtrans.payment_channels.{$order->payment_channel}.label")
            : null;
        if ($order->payment_method === 'MIDTRANS' && $channelLabel) {
            return "Midtrans ({$channelLabel})";
        }

        $type = $order->midtrans_payment_type ? ' ('.strtoupper(str_replace('_', ' ', (string) $order->midtrans_payment_type)).')' : '';

        return match ($order->payment_method) {
            'MIDTRANS' => 'Midtrans'.$type,
            'TRANSFER' => 'Transfer Bank',
            'CASH' => 'Tunai / Transfer Manual',
            default => (string) $order->payment_method,
        };
    }

    private function customerOrderUrl(Order $order): string
    {
        return $this->appUrl("/orders/{$order->uuid}");
    }

    private function appUrl(string $path): string
    {
        return rtrim((string) config('services.mobile_app.url'), '/').$path;
    }

    private function money(mixed $value): string
    {
        return 'Rp '.number_format((float) $value, 0, ',', '.');
    }

    private function qty(mixed $value): string
    {
        $q = (float) $value;

        return floor($q) === $q
            ? number_format($q, 0, ',', '.')
            : rtrim(number_format($q, 2, ',', '.'), '0');
    }

    private function time(mixed $value): string
    {
        if (! $value instanceof \DateTimeInterface) {
            return '-';
        }

        return Carbon::instance($value)->timezone('Asia/Makassar')->format('d/m/Y H:i').' WITA';
    }
}
