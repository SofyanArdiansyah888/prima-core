<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\UserController;

Route::middleware(['auth', 'verified', 'admin'])->prefix('master')->group(function () {
    Route::resource('users', UserController::class)
        ->parameters(['users' => 'user'])
        ->except(['show']);
});
