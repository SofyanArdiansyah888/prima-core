<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\AuthController;
use Modules\Customer\Http\Controllers\ProfileController;
use Modules\Customer\Http\Middleware\EnsureCustomer;
use Modules\Order\Http\Controllers\CustomerCatalogController;
use Modules\Order\Http\Controllers\CustomerOrderController;

Route::prefix('customer/v1')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('payments/midtrans-webhook', [CustomerOrderController::class, 'webhook']);

    Route::middleware(['auth:sanctum', EnsureCustomer::class])->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [ProfileController::class, 'show']);
        Route::put('me', [ProfileController::class, 'update']);

        Route::get('products', [CustomerCatalogController::class, 'index']);
        Route::get('products/{product}', [CustomerCatalogController::class, 'show']);

        Route::post('delivery/quote', [CustomerOrderController::class, 'quote']);
        Route::get('orders', [CustomerOrderController::class, 'index']);
        Route::post('orders', [CustomerOrderController::class, 'store']);
        Route::get('orders/{order}', [CustomerOrderController::class, 'show']);
        Route::post('orders/{order}/pay', [CustomerOrderController::class, 'pay']);
        Route::post('orders/{order}/sync-payment', [CustomerOrderController::class, 'syncPayment']);
        Route::post('orders/{order}/cancel', [CustomerOrderController::class, 'cancel']);
    });
});
