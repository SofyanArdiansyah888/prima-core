<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::post('orders/{order}/sync-payment', [OrderController::class, 'syncPayment'])->name('orders.sync-payment');
    Route::get('orders/{order}/approval-quote', [OrderController::class, 'approvalQuote'])->name('orders.approval-quote');
    Route::post('orders/{order}/approve', [OrderController::class, 'approve'])->name('orders.approve');
    Route::post('orders/{order}/reject', [OrderController::class, 'reject'])->name('orders.reject');
    Route::post('orders/{order}/cash-payment/verify', [OrderController::class, 'verifyCashPayment'])->name('orders.cash-payment.verify');
    Route::post('orders/{order}/cash-payment/reject', [OrderController::class, 'rejectCashPayment'])->name('orders.cash-payment.reject');
    Route::get('orders/{order}/print', [OrderController::class, 'print'])->name('orders.print');
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::resource('orders', OrderController::class)
        ->parameters(['orders' => 'order']);
});
