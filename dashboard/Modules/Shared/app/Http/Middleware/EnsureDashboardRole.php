<?php

namespace Modules\Shared\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dashboard hanya untuk admin & operator plant. Sesi web milik akun sales/sopir
 * (mis. dari sebelum aturan ini berlaku) diakhiri dan diarahkan ke halaman login.
 */
class EnsureDashboardRole
{
    public const MESSAGE = 'Akun sales/sopir hanya dapat masuk melalui aplikasi mobile.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user();

        if ($user instanceof User && ($user->isSales() || $user->isDriver())) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['email' => self::MESSAGE]);
        }

        return $next($request);
    }
}
