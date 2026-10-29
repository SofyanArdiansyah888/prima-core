<?php

use Illuminate\Support\Facades\Route;
use Modules\Dispatch\Http\Controllers\DriverDeliveryApiController;
use Modules\Dispatch\Http\Middleware\EnsureDriver;

Route::prefix('driver/v1')->group(function () {
    Route::post('login', [DriverDeliveryApiController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', EnsureDriver::class])->group(function () {
        Route::get('me', [DriverDeliveryApiController::class, 'me']);
        Route::post('logout', [DriverDeliveryApiController::class, 'logout']);
        Route::get('deliveries', [DriverDeliveryApiController::class, 'deliveries']);
        Route::post('deliveries/{suratJalan}/complete', [DriverDeliveryApiController::class, 'complete']);
    });
});
