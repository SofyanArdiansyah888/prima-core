<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Order\Models\Order;
use Modules\Order\Models\SitePhoto;
use Modules\Order\Services\ApproveOrderSite;
use Modules\Order\Services\CashPayment;
use Modules\Order\Services\ConcretePump;
use Modules\Order\Services\StoreSitePhoto;
use Modules\Shared\Enums\UserRole;

class SalesOrderApiController extends Controller
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
                'login' => ['Kredensial nomor HP / email atau kata sandi tidak cocok.'],
            ]);
        }

        if ($user->role !== UserRole::Sales || ! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Akun ini tidak memiliki akses operasional sales lapangan atau status tidak aktif.'],
            ]);
        }

        $token = $user->createToken('sales-mobile')->plainTextToken;

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
                'plants' => $user->batchingPlants->map(fn ($p) => [
                    'id' => $p->id,
                    'code' => $p->code,
                    'name' => $p->name,
                ])->values(),
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

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tab = $request->string('tab', 'pending')->toString();

        // Sales hanya melihat pesanan batching plant yang ditugaskan kepadanya
        $query = Order::query()
            ->visibleTo($user)
            ->with([
                'batchingPlant:id,uuid,code,name,phone,whatsapp,lat,lng,concrete_pump_fee',
                'items.product:id,uuid,code,name,unit,category',
                'cashRecorder:id,name',
                'cashVerifier:id,name',
            ]);

        if ($tab === 'pending') {
            $query->where('status', 'PENDING_APPROVAL');
        } else {
            $query->where('status', '!=', 'PENDING_APPROVAL');
        }

        $orders = $query->orderByDesc('id')->paginate(15);

        return response()->json([
            'data' => $orders->getCollection()->map(fn (Order $order) => $this->transform($order))->values(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeAccess($request->user(), $order);

        $order->load([
            'batchingPlant.branch',
            'items.product',
            'approver',
            'sitePhotos.user:id,name',
            'cashRecorder:id,name',
            'cashVerifier:id,name',
        ]);

        return response()->json([
            'data' => $this->transform($order),
        ]);
    }

    public function storePhoto(Request $request, Order $order, StoreSitePhoto $photos): JsonResponse
    {
        $order->loadMissing('batchingPlant');
        $this->authorizeAccess($request->user(), $order);

        $photo = $photos->store($request, $order, $request->user(), 'sales');

        return response()->json([
            'message' => 'Foto lokasi berhasil disimpan.',
            'data' => $photo->toApi(),
        ], 201);
    }

    public function recordCashPayment(Request $request, Order $order, CashPayment $cash): JsonResponse
    {
        $order->loadMissing('batchingPlant');
        $this->authorizeAccess($request->user(), $order);

        $data = $request->validate(CashPayment::rules(), [
            'photo.required' => 'Foto kuitansi / bukti terima uang wajib diambil.',
            'photo.image' => 'File harus berupa foto.',
            'photo.max' => 'Ukuran foto maksimal 8 MB.',
        ]);

        $order = $cash->record($order, $request->user(), (float) $data['amount'], $request->file('photo'), $data['notes'] ?? null);

        return response()->json([
            'message' => 'Pembayaran tunai dicatat. Menunggu verifikasi admin / keuangan.',
            'data' => $this->transform($order->fresh(['batchingPlant', 'items.product', 'approver', 'sitePhotos.user:id,name', 'cashRecorder', 'cashVerifier'])),
        ]);
    }

    public function approve(Request $request, Order $order, ApproveOrderSite $approveSite): JsonResponse
    {
        $this->authorizeAccess($request->user(), $order);

        $validated = $request->validate(ApproveOrderSite::rules());

        $order = $approveSite->approve($order, $request->user(), $validated);

        return response()->json([
            'message' => 'Pesanan berhasil disetujui (ACC).',
            'data' => $this->transform($order->fresh(['batchingPlant', 'items.product', 'approver'])),
        ]);
    }

    public function reject(Request $request, Order $order): JsonResponse
    {
        $this->authorizeAccess($request->user(), $order);

        if ($order->status !== 'PENDING_APPROVAL') {
            throw ValidationException::withMessages([
                'status' => ['Pesanan ini tidak dalam status menunggu verifikasi tempat.'],
            ]);
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $updated = Order::query()
            ->whereKey($order->id)
            ->where('status', 'PENDING_APPROVAL')
            ->update([
                'status' => 'CANCELLED',
                'rejection_reason' => $validated['rejection_reason'],
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            throw ValidationException::withMessages([
                'status' => ['Pesanan ini sudah diproses oleh petugas lain.'],
            ]);
        }

        return response()->json([
            'message' => 'Pesanan berhasil ditolak.',
            'data' => $this->transform($order->fresh(['batchingPlant', 'items.product'])),
        ]);
    }

    private function authorizeAccess(User $user, Order $order): void
    {
        if (! $user->canAccessPlant($order->batching_plant_id)) {
            abort(403, 'Pesanan ini milik batching plant yang tidak ditugaskan kepada Anda.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(Order $order): array
    {
        return [
            'uuid' => $order->uuid,
            'code' => $order->code,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'project_title' => $order->project_title,
            'delivery_address' => $order->delivery_address,
            'delivery_lat' => $order->delivery_lat !== null ? (float) $order->delivery_lat : null,
            'delivery_lng' => $order->delivery_lng !== null ? (float) $order->delivery_lng : null,
            'distance_km' => (float) $order->distance_km,
            'gps_distance_km' => $order->gps_distance_km !== null ? (float) $order->gps_distance_km : null,
            'is_distance_manual' => (bool) $order->is_distance_manual,
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'uses_concrete_pump' => (bool) $order->uses_concrete_pump,
            'concrete_pump_fee' => (float) $order->concrete_pump_fee,
            'concrete_pump_rate' => ConcretePump::rateFor($order->batchingPlant, $order->items->first()?->product?->category),
            'ppn' => (float) $order->ppn,
            'admin_fee' => (float) $order->admin_fee,
            'total_price' => (float) $order->total_price,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'cash_payment' => CashPayment::summary($order),
            'status' => $order->status,
            'approved_at' => $order->approved_at?->toIso8601String(),
            'approver_name' => $order->approver?->name,
            'survey_notes' => $order->survey_notes,
            'rejection_reason' => $order->rejection_reason,
            'created_at' => $order->created_at?->toIso8601String(),
            'site_photos' => $order->relationLoaded('sitePhotos')
                ? $order->sitePhotos->map(fn (SitePhoto $p) => $p->toApi())->values()
                : [],
            'plant' => $order->batchingPlant ? [
                'id' => $order->batchingPlant->id,
                'code' => $order->batchingPlant->code,
                'name' => $order->batchingPlant->name,
                'lat' => $order->batchingPlant->lat !== null ? (float) $order->batchingPlant->lat : null,
                'lng' => $order->batchingPlant->lng !== null ? (float) $order->batchingPlant->lng : null,
            ] : null,
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->product?->name,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
            ])->values(),
        ];
    }
}
