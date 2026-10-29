<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\SalesOrderApiController;
use Modules\Order\Http\Middleware\EnsureSales;

Route::prefix('sales/v1')->group(function () {
    Route::post('login', [SalesOrderApiController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', EnsureSales::class])->group(function () {
        Route::get('me', [SalesOrderApiController::class, 'me']);
        Route::post('logout', [SalesOrderApiController::class, 'logout']);
        Route::get('orders', [SalesOrderApiController::class, 'index']);
        Route::get('orders/{order}', [SalesOrderApiController::class, 'show']);
        Route::post('orders/{order}/approve', [SalesOrderApiController::class, 'approve']);
        Route::post('orders/{order}/reject', [SalesOrderApiController::class, 'reject']);
    });
});
