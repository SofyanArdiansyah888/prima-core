<?php

use Illuminate\Support\Facades\Route;
use Modules\WorkOrder\Http\Controllers\WorkOrderController;

Route::middleware(['auth', 'verified'])->prefix('production')->group(function () {
    Route::get('work-orders/{workOrder}/print', [WorkOrderController::class, 'print'])->name('work-orders.print');
    Route::resource('work-orders', WorkOrderController::class)
        ->parameters(['work-orders' => 'workOrder']);
});
