<?php

namespace Modules\DeliveryRate\Services;

use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\DeliveryRate\Models\PlantDeliveryRate;

class PlantDistanceService
{
    /**
     * Calculate Haversine distance between two coordinates in Kilometers.
     */
    public function calculateDistanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadiusKm * $c, 2);
    }

    /**
     * Find nearest active Batching Plant given a coordinate.
     *
     * @return array{plant: BatchingPlant|null, distance_km: float}
     */
    public function findNearestPlant(float $lat, float $lng, ?int $branchId = null): array
    {
        $query = BatchingPlant::query()
            ->where('is_active', true)
            ->whereNotNull('lat')
            ->whereNotNull('lng');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $plants = $query->with('branch:id,code,name')->get();

        if ($plants->isEmpty()) {
            return ['plant' => null, 'distance_km' => 0.0];
        }

        $nearest = null;
        $minDistance = INF;

        foreach ($plants as $plant) {
            $dist = $this->calculateDistanceKm($lat, $lng, (float) $plant->lat, (float) $plant->lng);
            if ($dist < $minDistance) {
                $minDistance = $dist;
                $nearest = $plant;
            }
        }

        return [
            'plant' => $nearest,
            'distance_km' => $minDistance === INF ? 0.0 : $minDistance,
        ];
    }

    /**
     * Calculate delivery fee based on plant delivery rate matrix.
     *
     * @return array{delivery_fee: float, rate_rule: string, details: string}
     */
    public function calculateDeliveryFee(int $plantId, float $distanceKm, ?string $category = null, float $quantity = 1.0): array
    {
        $rates = PlantDeliveryRate::query()
            ->where('batching_plant_id', $plantId)
            ->where('is_active', true)
            ->when($category, function ($q) use ($category) {
                $q->where(function ($sub) use ($category) {
                    $sub->where('product_category', $category)
                        ->orWhereNull('product_category');
                });
            })
            ->orderBy('min_distance_km')
            ->get();

        if ($rates->isEmpty()) {
            // Default baseline fallback if no rate setup: Rp 15.000 / km / unit (min Rp 100.000)
            $fee = max(100000, round($distanceKm * 15000 * max(1, $quantity), -3));
            return [
                'delivery_fee' => (float) $fee,
                'rate_rule' => 'Tarif Dasar Standar',
                'details' => sprintf('Estimasi jarak %.1f km @ Rp 15.000/km/unit', $distanceKm),
            ];
        }

        // Find matching rate bracket
        $matchedRate = $rates->first(function ($rate) use ($distanceKm) {
            return $distanceKm >= (float) $rate->min_distance_km && $distanceKm <= (float) $rate->max_distance_km;
        }) ?? $rates->last();

        $fee = (float) $matchedRate->base_fee;

        if ($matchedRate->rate_type === 'PER_UNIT_PER_KM') {
            $fee += ((float) $matchedRate->cost_per_km_unit * $distanceKm * max(1, $quantity));
        } elseif ($matchedRate->rate_type === 'TIER_RADIUS') {
            $fee += ((float) $matchedRate->cost_per_km_unit * max(1, $quantity));
        }

        if ((float) $matchedRate->min_charge > 0 && $fee < (float) $matchedRate->min_charge) {
            $fee = (float) $matchedRate->min_charge;
        }

        return [
            'delivery_fee' => round($fee, 0),
            'rate_rule' => $matchedRate->rate_type,
            'details' => sprintf('Zona %.0f - %.0f km (Tarif Dasar: Rp %s)', (float) $matchedRate->min_distance_km, (float) $matchedRate->max_distance_km, number_format((float) $matchedRate->base_fee, 0, ',', '.')),
        ];
    }
}
