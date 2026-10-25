<?php

namespace Modules\Dispatch\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Shared\Enums\UserRole;

class DriverDeliveryApiController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($validated['login']);

        $user = User::query()
            ->where(function ($q) use ($login) {
                $q->where('email', $login)
                    ->orWhere('phone', $login);
            })
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Kredensial nomor HP / email atau kata sandi supir tidak cocok.'],
            ]);
        }

        if ($user->role !== UserRole::Driver || ! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Akun ini tidak memiliki akses operasional supir armada atau status tidak aktif.'],
            ]);
        }

        $token = $user->createToken('driver-mobile')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'code' => $user->code,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role->value,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'code' => $user->branch->code,
                    'name' => $user->branch->name,
                ] : null,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load(['branch', 'batchingPlants']);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'code' => $user->code,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role->value,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'code' => $user->branch->code,
                    'name' => $user->branch->name,
                ] : null,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Berhasil keluar.',
        ]);
    }

    public function deliveries(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tab = $request->string('tab', 'active')->toString();

        $query = SuratJalan::query()
            ->with([
                'batchingPlant:id,uuid,code,name,phone,whatsapp,lat,lng',
                'items.product:id,uuid,code,name,unit',
                'items.order:id,uuid,code,customer_name,customer_phone,delivery_address,delivery_lat,delivery_lng',
            ])
            ->where(function ($q) use ($user) {
                $q->where('driver_id', $user->id);
                if ($user->phone) {
                    $q->orWhere('driver_phone', $user->phone);
                }
            });

        if ($tab === 'active') {
            $query->whereIn('status', ['PREPARED', 'DEPARTED', 'ON_THE_WAY', 'ARRIVED', 'UNLOADING']);
        } else {
            $query->whereIn('status', ['COMPLETED', 'CANCELLED', 'RETURNED']);
        }

        $deliveries = $query->orderByDesc('id')->paginate(15);

        return response()->json([
            'data' => $deliveries->getCollection()->map(fn (SuratJalan $sj) => $this->transform($sj))->values(),
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'total' => $deliveries->total(),
            ],
        ]);
    }

    public function complete(Request $request, SuratJalan $suratJalan): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Authorize: driver must match
        $isDriver = $suratJalan->driver_id === $user->id || ($user->phone && $suratJalan->driver_phone === $user->phone);
        if (! $isDriver) {
            abort(403, 'Surat jalan ini tidak ditugaskan kepada Anda.');
        }

        if ($suratJalan->status === 'COMPLETED') {
            return response()->json([
                'message' => 'Surat jalan ini sudah berstatus selesai.',
                'data' => $this->transform($suratJalan->load(['batchingPlant', 'items.product', 'items.order'])),
            ]);
        }

        $validated = $request->validate([
            'recipient_name' => ['required', 'string', 'max:128'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($suratJalan, $validated) {
            $suratJalan->update([
                'status' => 'COMPLETED',
                'arrival_time' => now(),
                'notes' => $validated['notes'] ?? $suratJalan->notes,
            ]);

            $suratJalan->items()->update([
                'status' => 'DELIVERED',
                'recipient_name' => $validated['recipient_name'],
                'received_at' => now(),
            ]);

            // Synchronize parent orders
            $orderIds = $suratJalan->items()->pluck('order_id')->unique()->filter();
            foreach ($orderIds as $orderId) {
                $order = Order::with('items')->find($orderId);
                if (! $order) {
                    continue;
                }

                $allFulfilled = $order->items->every(fn ($i) => (float) $i->fulfilled_quantity >= (float) $i->quantity);
                $hasPendingSj = SuratJalanItem::where('order_id', $orderId)
                    ->whereHas('suratJalan', fn ($q) => $q->whereIn('status', ['PREPARED', 'DEPARTED', 'ON_THE_WAY', 'ARRIVED', 'UNLOADING']))
                    ->exists();

                // If all fulfilled and no pending shipments remain: mark delivered_at,
                // but DO NOT finish the order. Order remains ON_DELIVERY until customer confirms or 48h timeout.
                if ($allFulfilled && ! $hasPendingSj) {
                    $order->update([
                        'delivered_at' => now(),
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Pengantaran surat jalan berhasil diselesaikan (e-POD terekam).',
            'data' => $this->transform($suratJalan->fresh(['batchingPlant', 'items.product', 'items.order'])),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(SuratJalan $sj): array
    {
        return [
            'uuid' => $sj->uuid,
            'code' => $sj->code,
            'vehicle_number' => $sj->vehicle_number,
            'vehicle_type' => $sj->vehicle_type,
            'driver_name' => $sj->driver_name,
            'driver_phone' => $sj->driver_phone,
            'status' => $sj->status,
            'departure_time' => $sj->departure_time?->toIso8601String(),
            'arrival_time' => $sj->arrival_time?->toIso8601String(),
            'gross_weight_kg' => (float) $sj->gross_weight_kg,
            'tare_weight_kg' => (float) $sj->tare_weight_kg,
            'net_weight_kg' => (float) $sj->net_weight_kg,
            'notes' => $sj->notes,
            'plant' => $sj->batchingPlant ? [
                'code' => $sj->batchingPlant->code,
                'name' => $sj->batchingPlant->name,
                'phone' => $sj->batchingPlant->phone,
            ] : null,
            'items' => $sj->items->map(fn ($item) => [
                'id' => $item->id,
                'product_name' => $item->product?->name,
                'quantity_delivered' => (float) $item->quantity_delivered,
                'unit' => $item->unit,
                'destination_customer_name' => $item->destination_customer_name,
                'destination_project_title' => $item->destination_project_title,
                'destination_address' => $item->destination_address,
                'destination_lat' => $item->destination_lat !== null ? (float) $item->destination_lat : null,
                'destination_lng' => $item->destination_lng !== null ? (float) $item->destination_lng : null,
                'status' => $item->status,
                'recipient_name' => $item->recipient_name,
                'received_at' => $item->received_at?->toIso8601String(),
                'order_code' => $item->order?->code,
                'customer_phone' => $item->order?->customer_phone,
            ])->values(),
        ];
    }
}
