<?php

use Illuminate\Support\Facades\Route;
use Modules\Branch\Http\Controllers\BranchController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('branches', BranchController::class)
        ->parameters(['branches' => 'branch'])
        ->except(['show']);
});
