<?php

namespace Modules\Order\Services;

final class OrderTotals
{
    /**
     * PPN 11% dikenakan atas material + ongkir + Concrete Pump (CP).
     *
     * @param  list<float>  $lineAmounts  unit price × quantity, before rounding
     * @return array{lines: list<float>, subtotal: float, delivery_fee: float, concrete_pump_fee: float, admin_fee: float, ppn: float, total_price: float}
     */
    public static function fromLineAmounts(array $lineAmounts, float $deliveryFee, float $adminFee = 0.0, float $concretePumpFee = 0.0): array
    {
        $lines = array_map(fn (float $amount): float => round($amount, 2), $lineAmounts);
        $subtotal = round(array_sum($lines), 2);
        $delivery = round($deliveryFee, 2);
        $pump = round($concretePumpFee, 2);
        $admin = round($adminFee, 2);
        $ppn = round(($subtotal + $delivery + $pump) * 0.11, 2);
        $total = round($subtotal + $delivery + $pump + $ppn + $admin, 2);

        return [
            'lines' => $lines,
            'subtotal' => $subtotal,
            'delivery_fee' => $delivery,
            'concrete_pump_fee' => $pump,
            'admin_fee' => $admin,
            'ppn' => $ppn,
            'total_price' => $total,
        ];
    }
}
