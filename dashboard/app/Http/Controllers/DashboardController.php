<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'branches' => Branch::query()->where('is_active', true)->count(),
                'plants' => BatchingPlant::query()->where('is_active', true)->count(),
                'users' => User::query()->where('is_active', true)->count(),
            ],
        ]);
    }
}
