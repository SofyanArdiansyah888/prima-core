<?php

use Illuminate\Support\Facades\Route;
use Modules\Banner\Http\Controllers\BannerController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('banners', BannerController::class)
        ->parameters(['banners' => 'banner'])
        ->except(['show']);
});
