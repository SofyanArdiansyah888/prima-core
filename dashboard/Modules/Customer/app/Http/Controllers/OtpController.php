<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\Customer\Models\CustomerOtp;
use Modules\Shared\Services\FonnteService;

class OtpController extends Controller
{
    public function request(Request $request, FonnteService $fonnte): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'purpose' => ['required', Rule::in(['login', 'reset'])],
        ]);

        $phone = $this->normalizePhone($data['phone']);
        $customer = Customer::query()->where('phone', $phone)->first();

        if (! $customer || ! $customer->is_active) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor belum terdaftar atau akun tidak aktif.',
            ]);
        }

        $recent = CustomerOtp::query()
            ->where('phone', $phone)
            ->where('purpose', $data['purpose'])
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
            ->where('purpose', $data['purpose'])
            ->delete();

        CustomerOtp::query()->create([
            'phone' => $phone,
            'purpose' => $data['purpose'],
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(5),
        ]);

        $label = $data['purpose'] === 'reset' ? 'atur ulang sandi' : 'masuk';
        $fonnte->send($phone, "Kode OTP Prima Sales Pro untuk {$label}: {$code}. Berlaku 5 menit.");

        return response()->json([
            'message' => 'Kode OTP dikirim ke WhatsApp.',
        ]);
    }

    public function verifyLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $this->normalizePhone($data['phone']);
        $this->consume($phone, 'login', $data['code']);

        $customer = Customer::query()->where('phone', $phone)->where('is_active', true)->first();
        if (! $customer) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor belum terdaftar atau akun tidak aktif.',
            ]);
        }

        return response()->json([
            'token' => $customer->createToken('mobile')->plainTextToken,
            'customer' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $phone = $this->normalizePhone($data['phone']);
        $this->consume($phone, 'reset', $data['code']);

        $customer = Customer::query()->where('phone', $phone)->where('is_active', true)->first();
        if (! $customer) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor belum terdaftar atau akun tidak aktif.',
            ]);
        }

        $customer->update(['password' => $data['password']]);

        return response()->json([
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }

    private function consume(string $phone, string $purpose, string $code): void
    {
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
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';
        if (str_starts_with($digits, '62')) {
            return '0'.substr($digits, 2);
        }
        if ($digits !== '' && ! str_starts_with($digits, '0')) {
            return '0'.$digits;
        }

        return $digits;
    }
}
