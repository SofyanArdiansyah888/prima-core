<?php

use Illuminate\Support\Facades\Route;
use Modules\Dispatch\Http\Controllers\DispatchController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('dispatches', DispatchController::class)->names('dispatch');
});
