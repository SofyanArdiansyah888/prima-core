<?php

namespace Modules\Order\Services;

final class OrderTotals
{
    /**
     * @param  list<float>  $lineAmounts  unit price × quantity, before rounding
     * @return array{lines: list<float>, subtotal: float, delivery_fee: float, ppn: float, total_price: float}
     */
    public static function fromLineAmounts(array $lineAmounts, float $deliveryFee): array
    {
        $lines = array_map(fn (float $amount): float => round($amount, 2), $lineAmounts);
        $subtotal = round(array_sum($lines), 2);
        $delivery = round($deliveryFee, 2);
        $ppn = round(($subtotal + $delivery) * 0.11, 2);
        $total = round($subtotal + $delivery + $ppn, 2);

        return [
            'lines' => $lines,
            'subtotal' => $subtotal,
            'delivery_fee' => $delivery,
            'ppn' => $ppn,
            'total_price' => $total,
        ];
    }
}
