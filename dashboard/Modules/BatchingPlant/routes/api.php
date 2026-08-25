<?php

use Illuminate\Support\Facades\Route;
use Modules\BatchingPlant\Http\Controllers\BatchingPlantController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('batchingplants', BatchingPlantController::class)->names('batchingplant');
});
