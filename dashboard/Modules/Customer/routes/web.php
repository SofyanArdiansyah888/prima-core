<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\CustomerController;

Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::patch('customers/{customer}/toggle-active', [CustomerController::class, 'toggleActive'])->name('customers.toggle-active');
    Route::resource('customers', CustomerController::class)
        ->parameters(['customers' => 'customer'])
        ->only(['index', 'show']);
});
