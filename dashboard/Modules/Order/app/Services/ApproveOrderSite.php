<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\DeliveryRate\Services\PlantDistanceService;
use Modules\Order\Models\Order;

/**
 * ACC verifikasi tempat (dashboard & mobile sales). Jarak, ongkir, CP, PPN, dan total
 * dihitung ulang bila titik bongkar digeser, sales mengisi jarak jalan aktual (km),
 * atau pilihan Concrete Pump (CP) diubah — agar tagihan sesuai kondisi lapangan.
 *
 * {@see quote()} juga dipakai untuk pratinjau ongkir di layar sebelum ACC, sehingga
 * angka yang terlihat sama persis dengan yang tersimpan saat ACC.
 */
class ApproveOrderSite
{
    public function __construct(private PlantDistanceService $distance) {}

    /**
     * Aturan validasi bersama untuk endpoint ACC & pratinjau dashboard / mobile.
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

            $order->update($updates + $this->quote($order, $data)['changes']);

            return $order;
        });
    }

    /**
     * Hitung jarak, ongkir, CP, PPN, dan total yang berlaku bila pesanan di-ACC
     * dengan input ini — tanpa menyimpan apa pun.
     *
     * @param  array{delivery_lat?: mixed, delivery_lng?: mixed, distance_km?: mixed, uses_concrete_pump?: mixed}  $data
     * @return array{changes: array<string, mixed>, distance_km: float, gps_distance_km: float|null, is_distance_manual: bool, delivery_fee: float, uses_concrete_pump: bool, concrete_pump_fee: float, subtotal: float, ppn: float, total_price: float}
     */
    public function quote(Order $order, array $data): array
    {
        $order->loadMissing(['batchingPlant', 'items.product']);

        $plant = $order->batchingPlant;
        $category = $order->items->first()?->product?->category ?? 'readymix';
        $changes = [];
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
            $changes['delivery_lat'] = $lat;
            $changes['delivery_lng'] = $lng;

            if ($plant && $plant->lat !== null && $plant->lng !== null) {
                $distanceKm = $this->distance->calculateDistanceKm($lat, $lng, (float) $plant->lat, (float) $plant->lng);
                $changes['gps_distance_km'] = $distanceKm;
                $changes['is_distance_manual'] = false;
                $recalculate = true;
            }
        }

        // 2. Jarak jalan aktual dari sales menggantikan jarak GPS untuk ongkir.
        if (filled($data['distance_km'] ?? null)) {
            $manualKm = round((float) $data['distance_km'], 2);
            if (abs($manualKm - (float) $order->distance_km) > 0.009 || ! $order->is_distance_manual || $pinMoved) {
                $distanceKm = $manualKm;
                $changes['is_distance_manual'] = true;
                $changes['gps_distance_km'] = $changes['gps_distance_km'] ?? ($order->gps_distance_km ?? $order->distance_km);
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

            $changes['distance_km'] = $distanceKm;
            $changes['delivery_fee'] = $deliveryFee;
            $changes['uses_concrete_pump'] = $pumpFee > 0;
            $changes['concrete_pump_fee'] = $totals['concrete_pump_fee'];
            $changes['subtotal'] = $totals['subtotal'];
            $changes['ppn'] = $totals['ppn'];
            $changes['total_price'] = $totals['total_price'];
        }

        $value = fn (string $key) => array_key_exists($key, $changes) ? $changes[$key] : $order->{$key};
        $gpsKm = $value('gps_distance_km');

        return [
            'changes' => $changes,
            'distance_km' => (float) $value('distance_km'),
            'gps_distance_km' => $gpsKm !== null ? (float) $gpsKm : null,
            'is_distance_manual' => (bool) $value('is_distance_manual'),
            'delivery_fee' => (float) $value('delivery_fee'),
            'uses_concrete_pump' => (bool) $value('uses_concrete_pump'),
            'concrete_pump_fee' => (float) $value('concrete_pump_fee'),
            'subtotal' => (float) $value('subtotal'),
            'ppn' => (float) $value('ppn'),
            'total_price' => (float) $value('total_price'),
        ];
    }
}
