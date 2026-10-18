<?php

use Illuminate\Support\Facades\Route;
use Modules\WorkOrder\Http\Controllers\WorkOrderController;

Route::middleware(['auth', 'verified'])->prefix('production')->group(function () {
    Route::resource('work-orders', WorkOrderController::class)
        ->parameters(['work-orders' => 'workOrder']);
});
