<?php

namespace Modules\Order\Observers;

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

    private function notifySales(Order $order): void
    {
        try {
            $sales = $this->salesContacts->forOrder($order);
            if ($sales->isEmpty()) {
                return;
            }

            $plantName = $order->batchingPlant()->value('name') ?? '-';
            $maps = $order->delivery_lat !== null && $order->delivery_lng !== null
                ? "\nPeta: https://maps.google.com/?q={$order->delivery_lat},{$order->delivery_lng}"
                : '';
            $message = "Pesanan baru {$order->code} perlu verifikasi lokasi.\n"
                ."Customer: {$order->customer_name} ({$order->customer_phone})\n"
                ."Proyek: {$order->project_title}\n"
                ."Alamat: {$order->delivery_address}{$maps}\n"
                ."Plant: {$plantName}\n"
                .'Silakan cek dan ACC di aplikasi sales.';

            foreach ($sales as $user) {
                $this->fonnte->send((string) $user->phone, $message);
            }
        } catch (\Throwable $e) {
            Log::warning('Gagal mengantri notifikasi WhatsApp ke sales: '.$e->getMessage());
        }
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
