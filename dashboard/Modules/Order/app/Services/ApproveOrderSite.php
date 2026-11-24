<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\DeliveryRate\Services\PlantDistanceService;
use Modules\Order\Models\Order;

/**
 * ACC verifikasi tempat (dashboard & mobile sales). Jarak, ongkir, CP, PPN, dan total
 * dihitung ulang bila titik bongkar digeser, sales mengisi jarak jalan manual (km),
 * atau pilihan Concrete Pump (CP) diubah — agar tagihan sesuai kondisi lapangan.
 */
class ApproveOrderSite
{
    public function __construct(private PlantDistanceService $distance) {}

    /**
     * Aturan validasi bersama untuk endpoint ACC dashboard & mobile.
     *
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        return [
            'delivery_lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:delivery_lng'],
            'delivery_lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:delivery_lat'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'survey_notes' => ['nullable', 'string', 'max:1000'],
            'distance_km' => ['nullable', 'numeric', 'gt:0', 'max:500'],
            'uses_concrete_pump' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @param  array{delivery_lat?: mixed, delivery_lng?: mixed, delivery_address?: ?string, survey_notes?: ?string, distance_km?: mixed, uses_concrete_pump?: mixed}  $data
     */
    public function approve(Order $order, User $approver, array $data): Order
    {
        return DB::transaction(function () use ($order, $approver, $data) {
            $order = Order::query()->lockForUpdate()->with(['batchingPlant', 'items.product'])->findOrFail($order->id);

            if ($order->status !== 'PENDING_APPROVAL') {
                throw ValidationException::withMessages([
                    'status' => ['Pesanan ini tidak dalam status menunggu verifikasi tempat.'],
                ]);
            }

            $updates = [
                'status' => 'CONFIRMED',
                'approved_at' => now(),
                'approved_by_id' => $approver->id,
                'survey_notes' => filled($data['survey_notes'] ?? null) ? $data['survey_notes'] : $order->survey_notes,
            ];

            if (filled($data['delivery_address'] ?? null)) {
                $updates['delivery_address'] = $data['delivery_address'];
            }

            $plant = $order->batchingPlant;
            $category = $order->items->first()?->product?->category ?? 'readymix';
            $recalculate = false;

            // 1. Titik bongkar digeser → jarak GPS baru.
            $distanceKm = (float) $order->distance_km;
            $hasPin = isset($data['delivery_lat'], $data['delivery_lng']);
            $pinMoved = $hasPin && (
                abs((float) $data['delivery_lat'] - (float) $order->delivery_lat) > 1e-7
                || abs((float) $data['delivery_lng'] - (float) $order->delivery_lng) > 1e-7
            );

            if ($pinMoved) {
                $lat = (float) $data['delivery_lat'];
                $lng = (float) $data['delivery_lng'];
                $updates['delivery_lat'] = $lat;
                $updates['delivery_lng'] = $lng;

                if ($plant && $plant->lat !== null && $plant->lng !== null) {
                    $distanceKm = $this->distance->calculateDistanceKm($lat, $lng, (float) $plant->lat, (float) $plant->lng);
                    $updates['gps_distance_km'] = $distanceKm;
                    $updates['is_distance_manual'] = false;
                    $recalculate = true;
                }
            }

            // 2. Jarak jalan manual dari sales menggantikan jarak GPS untuk ongkir.
            if (filled($data['distance_km'] ?? null)) {
                $manualKm = round((float) $data['distance_km'], 2);
                if (abs($manualKm - (float) $order->distance_km) > 0.009 || ! $order->is_distance_manual || $pinMoved) {
                    $distanceKm = $manualKm;
                    $updates['is_distance_manual'] = true;
                    $updates['gps_distance_km'] = $updates['gps_distance_km'] ?? ($order->gps_distance_km ?? $order->distance_km);
                    $recalculate = true;
                }
            }

            // 3. Pilihan Concrete Pump diubah saat survei.
            $usesPump = (bool) $order->uses_concrete_pump;
            if (array_key_exists('uses_concrete_pump', $data) && $data['uses_concrete_pump'] !== null) {
                $wantPump = filter_var($data['uses_concrete_pump'], FILTER_VALIDATE_BOOLEAN);
                if ($wantPump !== $usesPump) {
                    if ($wantPump && ConcretePump::rateFor($plant, $category) <= 0) {
                        throw ValidationException::withMessages([
                            'uses_concrete_pump' => ['Concrete Pump (CP) tidak tersedia untuk plant / produk ini.'],
                        ]);
                    }
                    $usesPump = $wantPump;
                    $recalculate = true;
                }
            }

            if ($recalculate && $plant) {
                $totalQty = (float) $order->items->sum('quantity');
                $deliveryFee = (float) $this->distance->calculateDeliveryFee($plant->id, $distanceKm, $category, $totalQty)['delivery_fee'];
                // Tarif CP yang sudah tercatat dipertahankan; ambil tarif plant hanya bila CP baru ditambahkan.
                $pumpFee = $usesPump
                    ? ((float) $order->concrete_pump_fee > 0 ? (float) $order->concrete_pump_fee : ConcretePump::rateFor($plant, $category))
                    : 0.0;

                $totals = OrderTotals::fromLineAmounts(
                    $order->items->map(fn ($item) => (float) $item->subtotal)->all(),
                    $deliveryFee,
                    (float) $order->admin_fee,
                    $pumpFee,
                );

                $updates['distance_km'] = $distanceKm;
                $updates['delivery_fee'] = $deliveryFee;
                $updates['uses_concrete_pump'] = $pumpFee > 0;
                $updates['concrete_pump_fee'] = $totals['concrete_pump_fee'];
                $updates['subtotal'] = $totals['subtotal'];
                $updates['ppn'] = $totals['ppn'];
                $updates['total_price'] = $totals['total_price'];
            }

            $order->update($updates);

            return $order;
        });
    }
}
