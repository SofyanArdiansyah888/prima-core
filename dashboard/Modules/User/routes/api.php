<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\StaffAuthApiController;

// Master data dikelola lewat dashboard web (middleware admin). Jangan buka apiResource
// di bawah auth:sanctum: token pelanggan/sales/supir ikut lolos guard tersebut.

Route::prefix('staff/v1')->group(function () {
    Route::post('login', [StaffAuthApiController::class, 'login'])->middleware('throttle:10,1')->name('staff.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [StaffAuthApiController::class, 'me'])->name('staff.me');
        Route::post('logout', [StaffAuthApiController::class, 'logout'])->name('staff.logout');
    });
});
