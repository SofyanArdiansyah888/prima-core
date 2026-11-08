<?php

namespace Modules\Order\Services;

use Illuminate\Support\Collection;
use Modules\Order\Models\Order;
use Modules\Shared\Support\PhoneNumber;

/**
 * Kontak sales untuk sebuah pesanan.
 *
 * Untuk saat ini setiap batching plant memakai 1 nomor WhatsApp yang sekaligus
 * menjadi nomor sales plant tersebut (kolom batching_plants.whatsapp).
 */
class OrderSalesContacts
{
    /**
     * @return Collection<int, array{name: string, whatsapp: string}>
     */
    public function forOrder(Order $order): Collection
    {
        $plant = $order->relationLoaded('batchingPlant')
            ? $order->batchingPlant
            : $order->batchingPlant()->first(['id', 'name', 'whatsapp']);

        $whatsapp = PhoneNumber::toInternational((string) $plant?->whatsapp);
        if ($whatsapp === '') {
            return collect();
        }

        return collect([[
            'name' => 'Sales '.$plant->name,
            'whatsapp' => $whatsapp,
        ]]);
    }
}
