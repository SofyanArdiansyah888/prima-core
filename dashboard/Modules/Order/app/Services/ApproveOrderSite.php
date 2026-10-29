<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\DeliveryRate\Services\PlantDistanceService;
use Modules\Order\Models\Order;

/**
 * ACC verifikasi tempat (dashboard & mobile sales). Bila titik bongkar digeser,
 * jarak, ongkir, PPN, dan total dihitung ulang agar tagihan Midtrans sesuai.
 */
class ApproveOrderSite
{
    public function __construct(private PlantDistanceService $distance) {}

    /**
     * @param  array{delivery_lat?: mixed, delivery_lng?: mixed, delivery_address?: ?string, survey_notes?: ?string}  $data
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

                $plant = $order->batchingPlant;
                if ($plant && $plant->lat !== null && $plant->lng !== null) {
                    $distanceKm = $this->distance->calculateDistanceKm($lat, $lng, (float) $plant->lat, (float) $plant->lng);
                    $updates['distance_km'] = $distanceKm;

                    $category = $order->items->first()?->product?->category ?? 'readymix';
                    $totalQty = (float) $order->items->sum('quantity');
                    $deliveryFee = (float) $this->distance->calculateDeliveryFee($plant->id, $distanceKm, $category, $totalQty)['delivery_fee'];

                    $totals = OrderTotals::fromLineAmounts(
                        $order->items->map(fn ($item) => (float) $item->subtotal)->all(),
                        $deliveryFee,
                        (float) $order->admin_fee,
                    );

                    $updates['delivery_fee'] = $deliveryFee;
                    $updates['subtotal'] = $totals['subtotal'];
                    $updates['ppn'] = $totals['ppn'];
                    $updates['total_price'] = $totals['total_price'];
                }
            }

            $order->update($updates);

            return $order;
        });
    }
}
