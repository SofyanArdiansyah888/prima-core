<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Shared\Enums\UserRole;

/**
 * Login tunggal staf lapangan mobile (sales & supir). Aplikasi mengarahkan
 * ke halaman sesuai `user.role`; endpoint per role tetap memakai token yang sama.
 */
class StaffAuthApiController extends Controller
{
    private const MOBILE_ROLES = [UserRole::Sales, UserRole::Driver];

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($validated['login']);
        $phone = $this->normalizePhone($login);

        $user = User::query()
            ->where(function ($q) use ($login, $phone) {
                $q->whereRaw('LOWER(email) = ?', [mb_strtolower($login)])
                    ->orWhere('phone', $login)
                    ->when($phone !== null, fn ($q) => $q->orWhere('phone', $phone));
            })
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Nomor HP / email atau kata sandi tidak cocok.'],
            ]);
        }

        if (! in_array($user->role, self::MOBILE_ROLES, true)) {
            throw ValidationException::withMessages([
                'login' => ['Akun ini bukan akun sales atau supir lapangan.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Akun staf ini sedang dinonaktifkan. Hubungi admin.'],
            ]);
        }

        $token = $user->createToken($user->role->value.'-mobile')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => $this->transform($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->transform($this->staff($request))]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->staff($request)->currentAccessToken()?->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    private function staff(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User || ! in_array($user->role, self::MOBILE_ROLES, true) || ! $user->is_active) {
            abort(403, 'Akses staf lapangan ditolak.');
        }

        return $user;
    }

    /** 0812…, 62812…, +62812…, 812… → 0812… */
    private function normalizePhone(string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if ($digits === '' || str_contains($value, '@')) {
            return null;
        }

        if (str_starts_with($digits, '62')) {
            $digits = '0'.substr($digits, 2);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '0'.$digits;
        }

        return $digits;
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(User $user): array
    {
        $user->loadMissing('branch');

        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'code' => $user->code,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->value,
            'branch' => $user->branch ? [
                'id' => $user->branch->id,
                'code' => $user->branch->code,
                'name' => $user->branch->name,
            ] : null,
        ];
    }
}
