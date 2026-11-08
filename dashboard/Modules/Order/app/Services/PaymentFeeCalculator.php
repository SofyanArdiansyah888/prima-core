<?php

namespace Modules\Order\Services;

use Modules\Order\Models\Order;

/**
 * Menghitung biaya layanan pembayaran Midtrans per metode yang dipilih pelanggan.
 *
 * Biaya persentase di-gross-up agar dana bersih yang diterima tetap utuh:
 * fee = (dasar × p + tetap) / (1 − p), karena Midtrans memotong persen dari total yang dibayar.
 * Total dibulatkan ke atas ke rupiah penuh (gross_amount Midtrans wajib bilangan bulat).
 */
class PaymentFeeCalculator
{
    /**
     * @return array<string, array{label: string, group: string, snap: list<string>, percent: float, fixed: float}>
     */
    public function channels(): array
    {
        $all = (array) config('services.midtrans.payment_channels', []);
        $enabled = (array) config('services.midtrans.enabled_channels', array_keys($all));

        $channels = [];
        foreach ($enabled as $code) {
            if (isset($all[$code])) {
                $channels[$code] = $all[$code];
            }
        }

        return $channels;
    }

    /**
     * @return array{label: string, group: string, snap: list<string>, percent: float, fixed: float}|null
     */
    public function channel(?string $code): ?array
    {
        return $code !== null ? ($this->channels()[$code] ?? null) : null;
    }

    /**
     * Nominal sebelum biaya layanan pembayaran (material + ongkir + PPN).
     */
    public function baseAmount(Order $order): float
    {
        return round((float) $order->subtotal + (float) $order->delivery_fee + (float) $order->ppn, 2);
    }

    /**
     * @return array{admin_fee: float, total_price: float}
     */
    public function quote(float $base, float $percent, float $fixed): array
    {
        $p = max(0.0, $percent) / 100;
        $feeRaw = $p < 1 ? ($base * $p + max(0.0, $fixed)) / (1 - $p) : 0.0;
        $total = (float) ceil(round($base + $feeRaw, 6));

        return [
            'admin_fee' => round($total - $base, 2),
            'total_price' => $total,
        ];
    }

    /**
     * @return array{admin_fee: float, total_price: float}
     */
    public function quoteForChannel(Order $order, string $code): array
    {
        $channel = $this->channel($code);
        abort_if($channel === null, 422, 'Metode pembayaran tidak tersedia.');

        return $this->quote($this->baseAmount($order), (float) $channel['percent'], (float) $channel['fixed']);
    }

    /**
     * Daftar metode beserta total yang harus dibayar (tanpa merinci biaya ke pelanggan).
     *
     * @return list<array{code: string, label: string, group: string, total: float}>
     */
    public function options(Order $order): array
    {
        $base = $this->baseAmount($order);
        $options = [];

        foreach ($this->channels() as $code => $channel) {
            $options[] = [
                'code' => $code,
                'label' => $channel['label'],
                'group' => $channel['group'],
                'total' => $this->quote($base, (float) $channel['percent'], (float) $channel['fixed'])['total_price'],
            ];
        }

        return $options;
    }

    /**
     * Terapkan metode ke pesanan. Mengembalikan true bila nominal/metode berubah (token Snap lama tidak berlaku).
     */
    public function apply(Order $order, string $code): bool
    {
        $quote = $this->quoteForChannel($order, $code);

        $changed = $order->payment_channel !== $code
            || abs((float) $order->total_price - $quote['total_price']) > 0.009;

        if ($changed) {
            $order->update([
                'payment_channel' => $code,
                'admin_fee' => $quote['admin_fee'],
                'total_price' => $quote['total_price'],
            ]);
        }

        return $changed;
    }

    public function label(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }

        return config("services.midtrans.payment_channels.{$code}.label") ?? $code;
    }
}
