<?php

use Illuminate\Support\Facades\Route;
use Modules\Dispatch\Http\Controllers\DispatchController;

Route::middleware(['auth', 'verified'])->prefix('dispatch')->group(function () {
    Route::resource('surat-jalan', DispatchController::class)
        ->parameters(['surat-jalan' => 'suratJalan']);
    Route::get('surat-jalan/{suratJalan}/print', [DispatchController::class, 'printView'])->name('surat-jalan.print');
    Route::put('surat-jalan/{suratJalan}/status', [DispatchController::class, 'updateStatus'])->name('surat-jalan.update-status');
});
