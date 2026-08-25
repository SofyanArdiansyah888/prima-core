<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Shared\Enums\UserRole;
use Modules\Shared\Services\CodeGenerator;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $users = User::query()
            ->with(['branch:id,uuid,code,name', 'batchingPlants:id,uuid,code,name'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
            ->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('batching_plant_id'), function ($q) use ($request) {
                $q->whereHas('batchingPlants', fn ($p) => $p->where('batching_plants.id', $request->integer('batching_plant_id')));
            })
            ->orderBy('code')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/user/index', [
            'users' => $users,
            'branches' => Branch::query()->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'plants' => BatchingPlant::query()->orderBy('code')->get(['id', 'uuid', 'code', 'name', 'branch_id']),
            'roles' => collect(UserRole::cases())->map(fn ($r) => ['value' => $r->value, 'label' => $r->label()]),
            'filters' => [
                'search' => $search,
                'role' => $request->input('role'),
                'branch_id' => $request->input('branch_id'),
                'batching_plant_id' => $request->input('batching_plant_id'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/user/form', [
            'user' => null,
            'branches' => Branch::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name', 'branch_id']),
            'roles' => collect(UserRole::cases())->map(fn ($r) => ['value' => $r->value, 'label' => $r->label()]),
        ]);
    }

    public function store(StoreUserRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $branch = isset($data['branch_id']) ? Branch::query()->find($data['branch_id']) : null;
        $region = $branch ? $codes->regionFromBranchCode($branch->code) : 'HQ';
        $code = $data['code'] ?? $codes->nextEmployeeCode($data['role'] === UserRole::Admin->value && ! $branch ? 'HQ' : $region);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'branch_id' => $data['branch_id'] ?? null,
            'code' => $code,
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        $user->batchingPlants()->sync($data['batching_plant_ids'] ?? []);

        return redirect()->route('users.index')->with('success', 'User berhasil dibuat.');
    }

    public function edit(User $user): Response
    {
        $user->load(['batchingPlants:id,uuid,code,name,branch_id', 'branch:id,uuid,code,name']);

        return Inertia::render('modules/user/form', [
            'user' => [
                ...$user->toArray(),
                'batching_plant_ids' => $user->batchingPlants->pluck('id'),
            ],
            'branches' => Branch::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name', 'branch_id']),
            'roles' => collect(UserRole::cases())->map(fn ($r) => ['value' => $r->value, 'label' => $r->label()]),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'branch_id' => $data['branch_id'] ?? null,
            'is_active' => $data['is_active'] ?? $user->is_active,
        ];

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);
        $user->batchingPlants()->sync($data['batching_plant_ids'] ?? []);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak dapat menonaktifkan akun sendiri.');
        }

        $user->update(['is_active' => false]);

        return redirect()->route('users.index')->with('success', 'User dinonaktifkan.');
    }
}
