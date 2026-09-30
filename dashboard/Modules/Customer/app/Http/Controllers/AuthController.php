<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Customer\Http\Requests\LoginCustomerRequest;
use Modules\Customer\Http\Requests\RegisterCustomerRequest;
use Modules\Customer\Models\Customer;

class AuthController extends Controller
{
    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $data = $request->validated();

        $customer = Customer::query()->create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'password' => $data['password'],
            'is_active' => true,
        ]);

        return response()->json($this->tokenPayload($customer), 201);
    }

    public function login(LoginCustomerRequest $request): JsonResponse
    {
        $customer = Customer::query()->where('phone', $request->string('phone')->toString())->first();

        if (! $customer || ! Hash::check($request->string('password')->toString(), $customer->password)) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor HP atau kata sandi salah.',
            ]);
        }

        if (! $customer->is_active) {
            throw ValidationException::withMessages([
                'phone' => 'Akun tidak aktif.',
            ]);
        }

        return response()->json($this->tokenPayload($customer));
    }

    public function logout(): JsonResponse
    {
        /** @var Customer $customer */
        $customer = request()->user();
        $customer->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Keluar berhasil.',
        ]);
    }

    /**
     * @return array{token: string, customer: array<string, mixed>}
     */
    private function tokenPayload(Customer $customer): array
    {
        return [
            'token' => $customer->createToken('mobile')->plainTextToken,
            'customer' => $this->customerPayload($customer),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function customerPayload(Customer $customer): array
    {
        return [
            'uuid' => $customer->uuid,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
        ];
    }
}
