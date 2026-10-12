<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Models\Customer;
use Modules\Customer\Services\CustomerOtpService;

class OtpController extends Controller
{
    public function request(Request $request, CustomerOtpService $otp): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'purpose' => ['required', Rule::in(['login', 'reset', 'register'])],
        ]);

        $otp->request($data['phone'], $data['purpose']);

        return response()->json([
            'message' => 'Kode OTP dikirim ke WhatsApp.',
        ]);
    }

    public function verifyLogin(Request $request, CustomerOtpService $otp): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.size' => 'Kode verifikasi harus 6 digit.',
        ]);

        $phone = $otp->consume($data['phone'], 'login', $data['code']);

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

    public function resetPassword(Request $request, CustomerOtpService $otp): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'code.size' => 'Kode verifikasi harus 6 digit.',
        ]);

        $phone = $otp->consume($data['phone'], 'reset', $data['code']);

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
}
