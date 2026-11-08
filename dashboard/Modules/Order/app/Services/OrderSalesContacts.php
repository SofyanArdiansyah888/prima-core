<?php

namespace Modules\Order\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Modules\Order\Models\Order;
use Modules\Shared\Enums\UserRole;

/**
 * Menentukan sales lapangan yang bertanggung jawab atas sebuah pesanan.
 *
 * Prioritas: sales aktif yang di-assign ke batching plant pesanan.
 * Fallback: sales aktif di cabang plant tersebut (sama dengan cakupan akses API sales).
 */
class OrderSalesContacts
{
    /**
     * @return Collection<int, User>
     */
    public function forOrder(Order $order): Collection
    {
        if (! $order->batching_plant_id) {
            return collect();
        }

        $base = fn () => User::query()
            ->where('role', UserRole::Sales->value)
            ->where('is_active', true)
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->orderBy('name');

        $assigned = $base()
            ->whereHas('batchingPlants', fn ($q) => $q->whereKey($order->batching_plant_id))
            ->get();

        if ($assigned->isNotEmpty()) {
            return $assigned;
        }

        $branchId = $order->batchingPlant()->value('branch_id');

        return $branchId ? $base()->where('branch_id', $branchId)->get() : collect();
    }
}
