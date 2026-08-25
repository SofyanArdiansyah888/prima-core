<?php

namespace Modules\BatchingPlant\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Http\Requests\StoreBatchingPlantRequest;
use Modules\BatchingPlant\Http\Requests\UpdateBatchingPlantRequest;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Shared\Enums\PlantStatus;
use Modules\Shared\Services\CodeGenerator;

class BatchingPlantController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $plants = BatchingPlant::query()
            ->with(['branch:id,uuid,code,name'])
            ->withCount('users')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderBy('code')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/batching-plant/index', [
            'plants' => $plants,
            'branches' => Branch::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => collect(PlantStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'filters' => [
                'search' => $search,
                'branch_id' => $request->input('branch_id'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/batching-plant/form', [
            'plant' => null,
            'branches' => Branch::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => collect(PlantStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function store(StoreBatchingPlantRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $branch = Branch::query()->findOrFail($data['branch_id']);
        $code = $data['code'] ?? $codes->nextPlantCode($branch->code);

        BatchingPlant::query()->create([
            ...$data,
            'code' => $code,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('batching-plants.index')->with('success', 'Batching plant berhasil dibuat.');
    }

    public function edit(BatchingPlant $batchingPlant): Response
    {
        $batchingPlant->load(['branch:id,uuid,code,name']);

        return Inertia::render('modules/batching-plant/form', [
            'plant' => $batchingPlant,
            'branches' => Branch::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => collect(PlantStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function update(UpdateBatchingPlantRequest $request, BatchingPlant $batchingPlant): RedirectResponse
    {
        $batchingPlant->update($request->validated());

        return redirect()->route('batching-plants.index')->with('success', 'Batching plant berhasil diperbarui.');
    }

    public function destroy(BatchingPlant $batchingPlant): RedirectResponse
    {
        $batchingPlant->update([
            'is_active' => false,
            'status' => PlantStatus::Inactive,
        ]);

        return redirect()->route('batching-plants.index')->with('success', 'Batching plant dinonaktifkan.');
    }
}
