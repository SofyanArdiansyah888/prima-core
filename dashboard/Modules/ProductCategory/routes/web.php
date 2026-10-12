<?php

use Illuminate\Support\Facades\Route;
use Modules\ProductCategory\Http\Controllers\ProductCategoryController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('product-categories', ProductCategoryController::class)
        ->parameters(['product-categories' => 'product_category'])
        ->except(['show']);
});
