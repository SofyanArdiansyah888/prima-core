<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::resource('orders', OrderController::class)
        ->parameters(['orders' => 'order']);
});
