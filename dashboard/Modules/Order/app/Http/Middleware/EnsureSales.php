<?php

namespace Modules\Order\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Enums\UserRole;
use Symfony\Component\HttpFoundation\Response;

class EnsureSales
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || $user->role !== UserRole::Sales || ! $user->is_active) {
            abort(403, 'Akses sales lapangan ditolak.');
        }

        return $next($request);
    }
}
