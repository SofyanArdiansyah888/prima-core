<?php

use Illuminate\Support\Facades\Route;
use Modules\PaymentReturn\Http\Controllers\PaymentReturnController;

Route::middleware(['auth', 'verified'])->prefix('finance')->group(function () {
    Route::get('payment-returns', [PaymentReturnController::class, 'index'])->name('payment-returns.index');
    Route::get('payment-returns/create', [PaymentReturnController::class, 'create'])->name('payment-returns.create');
    Route::post('payment-returns', [PaymentReturnController::class, 'store'])->name('payment-returns.store');
    Route::get('payment-returns/{paymentReturn}', [PaymentReturnController::class, 'show'])->name('payment-returns.show');
    Route::get('payment-returns/{paymentReturn}/print', [PaymentReturnController::class, 'print'])->name('payment-returns.print');
    Route::post('payment-returns/{paymentReturn}/approve', [PaymentReturnController::class, 'approve'])->name('payment-returns.approve');
    Route::post('payment-returns/{paymentReturn}/reject', [PaymentReturnController::class, 'reject'])->name('payment-returns.reject');
    Route::post('payment-returns/{paymentReturn}/refund', [PaymentReturnController::class, 'refund'])->name('payment-returns.refund');
});
