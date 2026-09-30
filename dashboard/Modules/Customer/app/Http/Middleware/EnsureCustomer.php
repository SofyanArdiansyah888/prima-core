<?php

namespace Modules\Customer\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Customer\Models\Customer;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Customer || ! $user->is_active) {
            abort(403, 'Akses pelanggan ditolak.');
        }

        return $next($request);
    }
}
