<?php

namespace Modules\Branch\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Branch\Http\Requests\StoreBranchRequest;
use Modules\Branch\Http\Requests\UpdateBranchRequest;
use Modules\Branch\Models\Branch;
use Modules\Shared\Services\CodeGenerator;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $branches = Branch::query()
            ->withCount(['batchingPlants', 'users'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('code')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/branch/index', [
            'branches' => $branches,
            'filters' => [
                'search' => $search,
                'is_active' => $request->input('is_active'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/branch/form', [
            'branch' => null,
        ]);
    }

    public function store(StoreBranchRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $code = $data['code'] ?? $codes->nextBranchCode($data['region']);

        Branch::query()->create([
            'code' => $code,
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('branches.index')->with('success', 'Cabang berhasil dibuat.');
    }

    public function edit(Branch $branch): Response
    {
        $branch->loadCount(['batchingPlants', 'users']);

        return Inertia::render('modules/branch/form', [
            'branch' => $branch,
        ]);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        return redirect()->route('branches.index')->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        if ($branch->batchingPlants()->exists()) {
            return back()->with('error', 'Cabang masih memiliki batching plant.');
        }

        $branch->update(['is_active' => false]);

        return redirect()->route('branches.index')->with('success', 'Cabang dinonaktifkan.');
    }
}
