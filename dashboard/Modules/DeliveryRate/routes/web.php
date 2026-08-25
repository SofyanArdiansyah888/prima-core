<?php

use Illuminate\Support\Facades\Route;
use Modules\DeliveryRate\Http\Controllers\DeliveryRateController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('delivery-rates', DeliveryRateController::class)
        ->parameters(['delivery-rates' => 'deliveryRate'])
        ->except(['show']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/api/delivery-rates/calculate-nearest', [DeliveryRateController::class, 'calculateNearest'])->name('delivery-rates.calculate-nearest');
});
