<?php

namespace Modules\DeliveryRate\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\DeliveryRate\Http\Requests\StoreDeliveryRateRequest;
use Modules\DeliveryRate\Http\Requests\UpdateDeliveryRateRequest;
use Modules\DeliveryRate\Models\PlantDeliveryRate;
use Modules\DeliveryRate\Services\PlantDistanceService;

class DeliveryRateController extends Controller
{
    public function index(Request $request): Response
    {
        $plantId = $request->input('batching_plant_id');

        $rates = PlantDeliveryRate::query()
            ->with(['batchingPlant:id,uuid,code,name,branch_id', 'batchingPlant.branch:id,code,name'])
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId))
            ->orderBy('batching_plant_id')
            ->orderBy('min_distance_km')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('modules/delivery-rate/index', [
            'rates' => $rates,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'filters' => [
                'batching_plant_id' => $plantId,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/delivery-rate/form', [
            'rate' => null,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'rateTypes' => [
                ['value' => 'PER_UNIT_PER_KM', 'label' => 'Tarif Per Unit Per Km'],
                ['value' => 'FLAT_PER_TRIP', 'label' => 'Flat Per Rit / Trip'],
                ['value' => 'TIER_RADIUS', 'label' => 'Tier Berdasarkan Radius Km'],
            ],
        ]);
    }

    public function store(StoreDeliveryRateRequest $request): RedirectResponse
    {
        PlantDeliveryRate::query()->create([
            ...$request->validated(),
            'is_active' => $request->validated()['is_active'] ?? true,
        ]);

        return redirect()->route('delivery-rates.index')->with('success', 'Tarif pengantaran plant berhasil ditambahkan.');
    }

    public function edit(PlantDeliveryRate $deliveryRate): Response
    {
        $deliveryRate->load(['batchingPlant:id,uuid,code,name']);

        return Inertia::render('modules/delivery-rate/form', [
            'rate' => $deliveryRate,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'rateTypes' => [
                ['value' => 'PER_UNIT_PER_KM', 'label' => 'Tarif Per Unit Per Km'],
                ['value' => 'FLAT_PER_TRIP', 'label' => 'Flat Per Rit / Trip'],
                ['value' => 'TIER_RADIUS', 'label' => 'Tier Berdasarkan Radius Km'],
            ],
        ]);
    }

    public function update(UpdateDeliveryRateRequest $request, PlantDeliveryRate $deliveryRate): RedirectResponse
    {
        $deliveryRate->update($request->validated());

        return redirect()->route('delivery-rates.index')->with('success', 'Tarif pengantaran plant berhasil diperbarui.');
    }

    public function destroy(PlantDeliveryRate $deliveryRate): RedirectResponse
    {
        $deliveryRate->delete();

        return redirect()->route('delivery-rates.index')->with('success', 'Tarif pengantaran dihapus.');
    }

    /**
     * API calculation endpoint for frontend interactive distance and fee calculator.
     */
    public function calculateNearest(Request $request, PlantDistanceService $service): JsonResponse
    {
        $request->validate([
            'lat' => ['required', 'numeric'],
            'lng' => ['required', 'numeric'],
            'plant_id' => ['nullable', 'exists:batching_plants,id'],
            'category' => ['nullable', 'string'],
            'quantity' => ['nullable', 'numeric', 'min:0.1'],
        ]);

        $lat = (float) $request->input('lat');
        $lng = (float) $request->input('lng');
        $plantId = $request->input('plant_id');
        $category = $request->input('category', 'readymix');
        $quantity = (float) $request->input('quantity', 1.0);

        if ($plantId) {
            $plant = BatchingPlant::findOrFail($plantId);
            $distance = $service->calculateDistanceKm($lat, $lng, (float) $plant->lat, (float) $plant->lng);
        } else {
            $nearest = $service->findNearestPlant($lat, $lng);
            $plant = $nearest['plant'];
            $distance = $nearest['distance_km'];
        }

        if (! $plant) {
            return response()->json(['error' => 'Tidak ada batching plant aktif ditemukan.'], 404);
        }

        $feeResult = $service->calculateDeliveryFee($plant->id, $distance, $category, $quantity);

        return response()->json([
            'plant' => [
                'id' => $plant->id,
                'name' => $plant->name,
                'code' => $plant->code,
                'lat' => (float) $plant->lat,
                'lng' => (float) $plant->lng,
            ],
            'distance_km' => $distance,
            'delivery_fee' => $feeResult['delivery_fee'],
            'rate_rule' => $feeResult['rate_rule'],
            'details' => $feeResult['details'],
        ]);
    }
}
