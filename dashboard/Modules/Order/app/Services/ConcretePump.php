<?php

namespace Modules\Order\Services;

use Modules\BatchingPlant\Models\BatchingPlant;

/**
 * Concrete Pump (CP): layanan pompa cor dengan tarif flat per pesanan yang diatur per batching plant.
 * Hanya berlaku untuk pesanan beton readymix.
 */
final class ConcretePump
{
    public const CATEGORY = 'readymix';

    /** Tarif CP plant untuk kategori pesanan ini; 0 = CP tidak tersedia. */
    public static function rateFor(?BatchingPlant $plant, ?string $category): float
    {
        if ($plant === null || $category !== self::CATEGORY) {
            return 0.0;
        }

        return max(0.0, round((float) $plant->concrete_pump_fee, 2));
    }
}
