<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::post('orders/{order}/sync-payment', [OrderController::class, 'syncPayment'])->name('orders.sync-payment');
    Route::resource('orders', OrderController::class)
        ->parameters(['orders' => 'order']);
});
