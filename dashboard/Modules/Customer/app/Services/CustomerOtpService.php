<?php

namespace Modules\Customer\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\Customer\Models\CustomerOtp;
use Modules\Customer\Support\PhoneNumber;
use Modules\Shared\Services\FonnteService;
use Throwable;

class CustomerOtpService
{
    public function __construct(private FonnteService $fonnte) {}

    public function request(string $rawPhone, string $purpose): void
    {
        $phone = $this->assertPhone($rawPhone);
        $customer = Customer::query()->where('phone', $phone)->first();

        if ($purpose === 'register') {
            if ($customer) {
                throw ValidationException::withMessages([
                    'phone' => 'Nomor WhatsApp sudah terdaftar. Silakan masuk.',
                ]);
            }
        } elseif (! $customer || ! $customer->is_active) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor belum terdaftar atau akun tidak aktif.',
            ]);
        }

        $recent = CustomerOtp::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->where('created_at', '>=', now()->subSeconds(60))
            ->exists();

        if ($recent) {
            throw ValidationException::withMessages([
                'phone' => 'Tunggu sebentar sebelum meminta kode baru.',
            ]);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        CustomerOtp::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->delete();

        $otp = CustomerOtp::query()->create([
            'phone' => $phone,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(5),
        ]);

        $label = match ($purpose) {
            'register' => 'daftar akun',
            'reset' => 'atur ulang sandi',
            default => 'masuk',
        };

        try {
            $this->fonnte->sendNow(
                $phone,
                "Kode OTP Prima Sales Pro untuk {$label}: {$code}. Berlaku 5 menit.",
            );
        } catch (Throwable $exception) {
            $otp->delete();
            Log::error('OTP WhatsApp gagal dikirim.', [
                'recipient' => PhoneNumber::mask($phone),
                'purpose' => $purpose,
                'error' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'phone' => 'Kode WhatsApp gagal dikirim. Coba lagi beberapa saat.',
            ]);
        }
    }

    public function consume(string $rawPhone, string $purpose, string $code): string
    {
        $phone = $this->assertPhone($rawPhone);

        $otp = CustomerOtp::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if (! $otp || $otp->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP tidak berlaku. Minta kode baru.',
            ]);
        }

        if ($otp->attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => 'Terlalu banyak percobaan. Minta kode baru.',
            ]);
        }

        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP salah.',
            ]);
        }

        $otp->delete();

        return $phone;
    }

    private function assertPhone(string $rawPhone): string
    {
        $phone = PhoneNumber::normalize($rawPhone);

        if (! PhoneNumber::isMobile($phone)) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor WhatsApp tidak valid.',
            ]);
        }

        return $phone;
    }
}
