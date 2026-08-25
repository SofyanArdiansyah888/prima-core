<?php

use Illuminate\Support\Facades\Route;
use Modules\WorkOrder\Http\Controllers\WorkOrderController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('workorders', WorkOrderController::class)->names('workorder');
});
