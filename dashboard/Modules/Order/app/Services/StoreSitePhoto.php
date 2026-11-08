<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Order\Models\Order;
use Modules\Order\Models\SitePhoto;

class StoreSitePhoto
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:lng'],
            'lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:lat'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function store(Request $request, ?Order $order, User $user, string $role, ?SuratJalan $suratJalan = null, ?float $destLat = null, ?float $destLng = null): SitePhoto
    {
        $destLat ??= $order?->delivery_lat !== null ? (float) $order->delivery_lat : null;
        $destLng ??= $order?->delivery_lng !== null ? (float) $order->delivery_lng : null;

        $data = $request->validate(self::rules(), [
            'photo.required' => 'Foto wajib diambil.',
            'photo.image' => 'File harus berupa foto.',
            'photo.max' => 'Ukuran foto maksimal 8 MB.',
        ]);

        $folder = 'site-photos/'.now()->format('Y/m');
        $path = $request->file('photo')->store($folder, SitePhoto::DISK);

        $lat = isset($data['lat']) ? (float) $data['lat'] : null;
        $lng = isset($data['lng']) ? (float) $data['lng'] : null;

        return SitePhoto::query()->create([
            'order_id' => $order?->id,
            'surat_jalan_id' => $suratJalan?->id,
            'user_id' => $user->id,
            'role' => $role,
            'path' => $path,
            'lat' => $lat,
            'lng' => $lng,
            'accuracy_m' => $data['accuracy'] ?? null,
            'distance_m' => $this->distance($lat, $lng, $destLat, $destLng),
            'notes' => $data['notes'] ?? null,
            'taken_at' => now(),
        ])->load('user:id,name');
    }

    private function distance(?float $lat, ?float $lng, ?float $destLat, ?float $destLng): ?int
    {
        if ($lat === null || $lng === null || $destLat === null || $destLng === null) {
            return null;
        }

        $earth = 6371000;
        $dLat = deg2rad($destLat - $lat);
        $dLng = deg2rad($destLng - $lng);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat)) * cos(deg2rad($destLat)) * sin($dLng / 2) ** 2;

        return (int) round($earth * 2 * atan2(sqrt($a), sqrt(1 - $a)));
    }
}
