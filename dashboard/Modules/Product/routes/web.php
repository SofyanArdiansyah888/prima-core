<?php

use Illuminate\Support\Facades\Route;
use Modules\Product\Http\Controllers\ProductController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('products', ProductController::class)
        ->parameters(['products' => 'product'])
        ->except(['show']);
});
