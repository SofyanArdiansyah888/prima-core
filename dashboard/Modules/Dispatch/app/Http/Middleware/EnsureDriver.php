<?php

namespace Modules\Dispatch\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Enums\UserRole;
use Symfony\Component\HttpFoundation\Response;

class EnsureDriver
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || $user->role !== UserRole::Driver || ! $user->is_active) {
            abort(403, 'Akses supir armada ditolak.');
        }

        return $next($request);
    }
}
