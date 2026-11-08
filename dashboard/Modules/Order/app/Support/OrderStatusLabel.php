<?php

namespace Modules\Order\Support;

final class OrderStatusLabel
{
    public static function for(?string $status): string
    {
        return match ($status) {
            'PENDING_APPROVAL' => 'Menunggu Verifikasi Lokasi',
            'CONFIRMED' => 'Disetujui',
            'PROCESSING', 'WORK_ORDER_CREATED', 'IN_PRODUCTION' => 'Diproses',
            'ON_DELIVERY', 'PARTIAL_DELIVERY' => 'Dalam Pengiriman',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '-',
        };
    }
}
