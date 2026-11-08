<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;
use Modules\Shared\Http\Middleware\EnsureDashboardRole;
use Modules\Shared\Services\CodeGenerator;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CodeGenerator::class);
    }

    public function boot(): void
    {
        $this->configureDefaults();

        Fortify::authenticateUsing(function ($request) {
            $user = User::query()
                ->where(Fortify::username(), $request->{Fortify::username()})
                ->first();

            if ($user
                && $user->is_active
                && Hash::check($request->password, $user->password)
            ) {
                // Dashboard hanya untuk admin & operator plant; sales/sopir memakai aplikasi mobile.
                if ($user->isSales() || $user->isDriver()) {
                    throw ValidationException::withMessages([
                        Fortify::username() => EnsureDashboardRole::MESSAGE,
                    ]);
                }

                return $user;
            }

            return null;
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
