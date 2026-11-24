<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Modules\Order\Models\Order;
use Modules\Order\Models\SitePhoto;

/**
 * Pembayaran tunai di lapangan: sales mencatat nominal + foto kuitansi,
 * lalu admin / keuangan memverifikasi di dashboard sebelum pesanan dianggap lunas.
 */
class CashPayment
{
    /**
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function record(Order $order, User $sales, float $amount, UploadedFile $photo, ?string $notes): Order
    {
        return DB::transaction(function () use ($order, $sales, $amount, $photo, $notes) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (in_array($order->status, ['PENDING_APPROVAL', 'CANCELLED'], true)) {
                throw ValidationException::withMessages([
                    'amount' => ['Pembayaran hanya bisa dicatat setelah lokasi di-ACC dan pesanan tidak dibatalkan.'],
                ]);
            }
            if ($order->isPaid()) {
                throw ValidationException::withMessages(['amount' => ['Pesanan ini sudah lunas.']]);
            }
            if ($order->hasPendingCashPayment()) {
                throw ValidationException::withMessages([
                    'amount' => ['Pembayaran tunai sudah dicatat dan sedang menunggu verifikasi.'],
                ]);
            }
            if (abs(round($amount, 2) - (float) $order->total_price) > 0.009) {
                throw ValidationException::withMessages([
                    'amount' => ['Nominal tunai harus sama dengan total tagihan Rp '.number_format((float) $order->total_price, 0, ',', '.').'.'],
                ]);
            }

            $path = $photo->store('cash-payments/'.now()->format('Y/m'), SitePhoto::DISK);

            $order->update([
                'payment_method' => 'CASH',
                'payment_channel' => null,
                'cash_payment_amount' => round($amount, 2),
                'cash_payment_proof_path' => $path,
                'cash_payment_notes' => $notes,
                'cash_recorded_by_id' => $sales->id,
                'cash_recorded_at' => now(),
                'cash_verified_by_id' => null,
                'cash_verified_at' => null,
                'cash_rejection_reason' => null,
            ]);

            return $order;
        });
    }

    public function verify(Order $order, User $verifier): Order
    {
        return DB::transaction(function () use ($order, $verifier) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (! $order->hasPendingCashPayment()) {
                throw ValidationException::withMessages(['cash' => ['Tidak ada pembayaran tunai yang menunggu verifikasi.']]);
            }

            // Update terpisah dari status bayar agar observer WA "lunas" tetap terpicu sekali.
            $order->update([
                'cash_verified_by_id' => $verifier->id,
                'cash_verified_at' => now(),
                'payment_status' => 'PAID',
                'paid_at' => now(),
            ]);

            return $order;
        });
    }

    public function reject(Order $order, User $verifier, string $reason): Order
    {
        return DB::transaction(function () use ($order, $verifier, $reason) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (! $order->hasPendingCashPayment()) {
                throw ValidationException::withMessages(['cash' => ['Tidak ada pembayaran tunai yang menunggu verifikasi.']]);
            }

            // Kembali ke pembayaran online agar customer tetap bisa membayar via Midtrans.
            $order->update([
                'payment_method' => 'MIDTRANS',
                'cash_verified_by_id' => $verifier->id,
                'cash_rejection_reason' => $reason,
            ]);

            return $order;
        });
    }

    public static function proofUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (request()->hasHeader('Host')) {
            return rtrim(request()->getSchemeAndHttpHost(), '/').'/storage/'.ltrim($path, '/');
        }

        return Storage::disk(SitePhoto::DISK)->url($path);
    }

    /**
     * Ringkasan status tunai untuk API / Inertia.
     *
     * @return array<string, mixed>|null
     */
    public static function summary(Order $order): ?array
    {
        if ($order->cash_recorded_at === null) {
            return null;
        }

        $status = match (true) {
            $order->cash_verified_at !== null => 'VERIFIED',
            $order->cash_rejection_reason !== null => 'REJECTED',
            default => 'PENDING_VERIFICATION',
        };

        return [
            'status' => $status,
            'amount' => (float) $order->cash_payment_amount,
            'proof_url' => self::proofUrl($order->cash_payment_proof_path),
            'notes' => $order->cash_payment_notes,
            'recorded_by' => $order->cashRecorder?->name,
            'recorded_at' => $order->cash_recorded_at?->toIso8601String(),
            'verified_by' => $order->cashVerifier?->name,
            'verified_at' => $order->cash_verified_at?->toIso8601String(),
            'rejection_reason' => $order->cash_rejection_reason,
        ];
    }
}
