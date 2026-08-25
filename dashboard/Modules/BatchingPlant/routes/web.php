<?php

use Illuminate\Support\Facades\Route;
use Modules\BatchingPlant\Http\Controllers\BatchingPlantController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('batching-plants', BatchingPlantController::class)
        ->parameters(['batching-plants' => 'batchingPlant'])
        ->except(['show']);
});
