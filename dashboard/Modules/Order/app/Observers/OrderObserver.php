<?php

namespace Modules\Order\Observers;

use Modules\Order\Models\Order;
use Modules\Shared\Services\FonnteService;

class OrderObserver
{
    public function __construct(private FonnteService $fonnte) {}

    public function created(Order $order): void
    {
        $message = "Pesanan {$order->code} berhasil dibuat. Status: {$this->label($order->status)}. Total Rp ".number_format((float) $order->total_price, 0, ',', '.');
        $this->fonnte->send((string) $order->customer_phone, $message);

        $admin = config('services.fonnte.admin_phone');
        if (is_string($admin) && trim($admin) !== '') {
            $adminPhones = array_filter(array_map('trim', explode(',', $admin)));
            foreach ($adminPhones as $adminPhone) {
                $this->fonnte->send($adminPhone, "Pesanan baru {$order->code} dari {$order->customer_name}. Status: {$this->label($order->status)}.");
            }
        }
    }

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        $this->fonnte->send(
            (string) $order->customer_phone,
            "Status pesanan {$order->code} berubah menjadi {$this->label($order->status)}.",
        );
    }

    private function label(?string $status): string
    {
        return match ($status) {
            'DRAFT' => 'Draf',
            'CONFIRMED' => 'Dikonfirmasi',
            'WORK_ORDER_CREATED' => 'SPK Terbit',
            'IN_PRODUCTION' => 'Dalam Produksi',
            'PARTIAL_DELIVERY' => 'Sebagian Terkirim',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '',
        };
    }
}
