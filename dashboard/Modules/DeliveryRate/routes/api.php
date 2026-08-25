<?php

use Illuminate\Support\Facades\Route;
use Modules\DeliveryRate\Http\Controllers\DeliveryRateController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('deliveryrates', DeliveryRateController::class)->names('deliveryrate');
});
