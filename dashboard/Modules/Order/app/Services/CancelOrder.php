<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Order\Models\Order;

/**
 * Pembatalan pesanan oleh admin. Pelanggan tidak bisa membatalkan sendiri;
 * bila pesanan sudah lunas, admin wajib mencatat refund (dikembalikan manual
 * di luar sistem, mis. transfer atau dashboard Midtrans).
 */
class CancelOrder
{
    /**
     * @param  array{cancellation_reason: string, refund_amount?: mixed, refund_reference?: ?string}  $data
     */
    public function cancel(Order $order, User $admin, array $data): Order
    {
        return DB::transaction(function () use ($order, $admin, $data) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (in_array($order->status, ['COMPLETED', 'CANCELLED'], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Pesanan sudah final dan tidak dapat dibatalkan.'],
                ]);
            }

            $hasDeliveries = $order->suratJalanItems()->whereIn('status', ['ON_TRUCK', 'DELIVERED'])->exists();
            if ($hasDeliveries) {
                throw ValidationException::withMessages([
                    'status' => ['Pesanan tidak dapat dibatalkan karena pengiriman sedang berjalan atau sudah diserahterimakan.'],
                ]);
            }

            $updates = [
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
                'cancelled_by_id' => $admin->id,
                'cancellation_reason' => $data['cancellation_reason'],
            ];

            if ($order->isPaid()) {
                $amount = $data['refund_amount'] ?? null;
                if ($amount === null || $amount === '' || (float) $amount < 0 || (float) $amount > (float) $order->total_price) {
                    throw ValidationException::withMessages([
                        'refund_amount' => ['Pesanan sudah lunas: isi nominal refund (maksimal total tagihan).'],
                    ]);
                }

                $updates += [
                    'payment_status' => 'REFUNDED',
                    'refunded_at' => now(),
                    'refunded_by_id' => $admin->id,
                    'refund_amount' => round((float) $amount, 2),
                    'refund_reference' => $data['refund_reference'] ?? null,
                ];
            }

            $order->update($updates);

            // SPK yang belum selesai ikut dihentikan agar plant tidak memproduksi.
            $order->workOrders()->whereIn('status', ['SCHEDULED', 'IN_PRODUCTION'])->update(['status' => 'CANCELLED']);

            return $order;
        });
    }
}
