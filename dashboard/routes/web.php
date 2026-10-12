<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('laporan')->group(function () {
        Route::get('penjualan', [ReportController::class, 'sales'])->name('reports.sales');
        Route::get('penjualan/excel', [ReportController::class, 'salesExcel'])->name('reports.sales.excel');
        Route::get('penjualan/pdf', [ReportController::class, 'salesPdf'])->name('reports.sales.pdf');
        Route::get('produksi', [ReportController::class, 'production'])->name('reports.production');
        Route::get('produksi/excel', [ReportController::class, 'productionExcel'])->name('reports.production.excel');
        Route::get('produksi/pdf', [ReportController::class, 'productionPdf'])->name('reports.production.pdf');
        Route::get('distribusi', [ReportController::class, 'dispatch'])->name('reports.dispatch');
        Route::get('distribusi/excel', [ReportController::class, 'dispatchExcel'])->name('reports.dispatch.excel');
        Route::get('distribusi/pdf', [ReportController::class, 'dispatchPdf'])->name('reports.dispatch.pdf');
    });
});

require __DIR__.'/settings.php';
