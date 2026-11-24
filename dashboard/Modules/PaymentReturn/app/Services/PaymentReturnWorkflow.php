<?php

namespace Modules\PaymentReturn\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\PaymentReturn\Models\PaymentReturn;
use Modules\PaymentReturn\Models\PaymentReturnItem;
use Modules\Shared\Services\CodeGenerator;

/**
 * Alur Berita Acara retur pembayaran sebagian (mis. pesan 10 m³, terpakai cor 8 m³ → retur 2 m³).
 * Nominal = Σ(volume retur × harga satuan) + PPN 11%; ongkir & CP tidak dikembalikan.
 */
class PaymentReturnWorkflow
{
    public const PPN_RATE = 0.11;

    public function __construct(private CodeGenerator $codes) {}

    /**
     * Volume yang masih bisa diretur per order item (dikurangi BA aktif lain).
     *
     * @return array<int, float> order_item_id => sisa volume
     */
    public function returnableQuantities(Order $order): array
    {
        $order->loadMissing('items');

        $used = PaymentReturnItem::query()
            ->whereIn('order_item_id', $order->items->pluck('id'))
            ->whereHas('paymentReturn', fn ($q) => $q->whereIn('status', PaymentReturn::ACTIVE_STATUSES))
            ->selectRaw('order_item_id, SUM(quantity) as qty')
            ->groupBy('order_item_id')
            ->pluck('qty', 'order_item_id');

        return $order->items->mapWithKeys(fn (OrderItem $item) => [
            $item->id => max(0.0, round((float) $item->quantity - (float) ($used[$item->id] ?? 0), 2)),
        ])->all();
    }

    /**
     * Nominal yang masih bisa dikembalikan (total dibayar − BA aktif − refund lain).
     */
    public function returnableAmount(Order $order): float
    {
        $active = (float) PaymentReturn::query()
            ->where('order_id', $order->id)
            ->whereIn('status', PaymentReturn::ACTIVE_STATUSES)
            ->sum('amount');
        $refundedOutsideBa = max(0.0, (float) $order->refund_amount - (float) PaymentReturn::query()
            ->where('order_id', $order->id)
            ->where('status', PaymentReturn::STATUS_REFUNDED)
            ->sum('amount'));

        return max(0.0, round((float) $order->total_price - $active - $refundedOutsideBa, 2));
    }

    /**
     * @param  array{reason: string, items: list<array{order_item_id: int|string, quantity: float|int|string}>, customer_bank_name?: ?string, customer_bank_account?: ?string, customer_account_name?: ?string}  $data
     */
    public function create(Order $order, User $creator, array $data): PaymentReturn
    {
        return DB::transaction(function () use ($order, $creator, $data) {
            $order = Order::query()->lockForUpdate()->with(['items', 'batchingPlant.branch'])->findOrFail($order->id);

            if (! $order->isPaid()) {
                throw ValidationException::withMessages([
                    'items' => ['Berita Acara retur hanya bisa dibuat untuk pesanan yang sudah lunas.'],
                ]);
            }

            $remaining = $this->returnableQuantities($order);
            $items = $order->items->keyBy('id');
            $rows = [];

            foreach ($data['items'] as $index => $row) {
                $qty = round((float) $row['quantity'], 2);
                if ($qty <= 0) {
                    continue;
                }

                $item = $items->get((int) $row['order_item_id']);
                if ($item === null) {
                    throw ValidationException::withMessages(["items.$index.order_item_id" => ['Item tidak termasuk pesanan ini.']]);
                }

                $max = $remaining[$item->id] ?? 0.0;
                if ($qty > $max + 0.0001) {
                    throw ValidationException::withMessages([
                        "items.$index.quantity" => [sprintf(
                            'Volume retur melebihi sisa yang bisa diretur (%s %s).',
                            rtrim(rtrim(number_format($max, 2, '.', ''), '0'), '.'),
                            $item->unit,
                        )],
                    ]);
                }

                $rows[] = [
                    'order_item_id' => $item->id,
                    'quantity' => $qty,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => round($qty * (float) $item->unit_price, 2),
                ];
            }

            if ($rows === []) {
                throw ValidationException::withMessages(['items' => ['Isi volume retur minimal satu item.']]);
            }

            $subtotal = round(array_sum(array_column($rows, 'subtotal')), 2);
            $ppn = round($subtotal * self::PPN_RATE, 2);
            $amount = round($subtotal + $ppn, 2);

            if ($amount > $this->returnableAmount($order) + 0.009) {
                throw ValidationException::withMessages([
                    'items' => ['Nominal retur melebihi sisa pembayaran yang bisa dikembalikan.'],
                ]);
            }

            $branch = $order->batchingPlant?->branch;
            $region = $branch ? $this->codes->regionFromBranchCode($branch->code) : 'HQ';

            $return = PaymentReturn::query()->create([
                'code' => $this->codes->nextPaymentReturnCode($region),
                'order_id' => $order->id,
                'batching_plant_id' => $order->batching_plant_id,
                'subtotal' => $subtotal,
                'ppn' => $ppn,
                'amount' => $amount,
                'reason' => $data['reason'],
                'customer_bank_name' => $data['customer_bank_name'] ?? null,
                'customer_bank_account' => $data['customer_bank_account'] ?? null,
                'customer_account_name' => $data['customer_account_name'] ?? null,
                'status' => array_key_first(PaymentReturn::STEPS),
                'created_by_id' => $creator->id,
            ]);

            $return->items()->createMany($rows);

            return $return;
        });
    }

    public function approve(PaymentReturn $return, User $user, ?string $notes): PaymentReturn
    {
        return $this->decide($return, $user, 'approved', $notes);
    }

    public function reject(PaymentReturn $return, User $user, string $notes): PaymentReturn
    {
        return $this->decide($return, $user, 'rejected', $notes);
    }

    private function decide(PaymentReturn $return, User $user, string $decision, ?string $notes): PaymentReturn
    {
        return DB::transaction(function () use ($return, $user, $decision, $notes) {
            $return = PaymentReturn::query()->lockForUpdate()->findOrFail($return->id);
            $role = $return->currentStepRole();

            if ($role === null) {
                throw ValidationException::withMessages(['status' => ['Berita Acara ini tidak sedang menunggu persetujuan.']]);
            }
            if ($user->role !== $role) {
                abort(403, 'Tahap ini harus disetujui oleh '.$role->label().'.');
            }

            $return->approvals()->create([
                'step' => $role->value,
                'user_id' => $user->id,
                'decision' => $decision,
                'notes' => $notes,
                'decided_at' => now(),
            ]);

            if ($decision === 'rejected') {
                $return->update(['status' => PaymentReturn::STATUS_REJECTED, 'rejected_at' => now()]);

                return $return;
            }

            $statuses = array_keys(PaymentReturn::STEPS);
            $next = $statuses[array_search($return->status, $statuses, true) + 1] ?? null;

            $return->update($next !== null
                ? ['status' => $next]
                : ['status' => PaymentReturn::STATUS_APPROVED, 'approved_at' => now()]);

            return $return;
        });
    }

    /**
     * Keuangan / admin menandai dana sudah ditransfer ke customer setelah Direksi menyetujui.
     */
    public function markRefunded(PaymentReturn $return, User $user, string $reference): PaymentReturn
    {
        return DB::transaction(function () use ($return, $user, $reference) {
            $return = PaymentReturn::query()->lockForUpdate()->findOrFail($return->id);

            if ($return->status !== PaymentReturn::STATUS_APPROVED) {
                throw ValidationException::withMessages(['status' => ['Dana hanya bisa ditandai dikembalikan setelah disetujui Direksi.']]);
            }

            $return->update([
                'status' => PaymentReturn::STATUS_REFUNDED,
                'refunded_at' => now(),
                'refunded_by_id' => $user->id,
                'refund_reference' => $reference,
            ]);

            $order = Order::query()->lockForUpdate()->findOrFail($return->order_id);
            $refunded = round((float) $order->refund_amount + (float) $return->amount, 2);
            $updates = [
                'refund_amount' => $refunded,
                'refunded_at' => now(),
                'refunded_by_id' => $user->id,
                'refund_reference' => $return->code.' / '.$reference,
            ];
            // Retur sebagian tidak mengubah status lunas; hanya bila seluruh tagihan dikembalikan.
            if ($refunded >= (float) $order->total_price - 0.009) {
                $updates['payment_status'] = 'REFUNDED';
            }
            $order->update($updates);

            return $return;
        });
    }
}
