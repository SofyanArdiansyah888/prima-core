<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::post('orders/{order}/sync-payment', [OrderController::class, 'syncPayment'])->name('orders.sync-payment');
    Route::post('orders/{order}/approve', [OrderController::class, 'approve'])->name('orders.approve');
    Route::post('orders/{order}/reject', [OrderController::class, 'reject'])->name('orders.reject');
    Route::resource('orders', OrderController::class)
        ->parameters(['orders' => 'order']);
});
