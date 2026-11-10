<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Customer\Models\Customer;

/**
 * Data pelanggan aplikasi mobile untuk dashboard staf.
 * Admin / akses semua plant melihat seluruh pelanggan; staf terbatas hanya
 * pelanggan yang pernah memesan di plant miliknya, dengan riwayat order plant tsb.
 */
class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $plantId = $request->input('batching_plant_id');

        $customers = Customer::query()
            ->visibleTo($user)
            ->when($search !== '', function (Builder $q) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $q->where(function (Builder $inner) use ($term) {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$term]);
                });
            })
            ->when($status === 'active', fn (Builder $q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn (Builder $q) => $q->where('is_active', false))
            ->when($plantId, fn (Builder $q) => $q->whereHas(
                'orders',
                fn (Builder $o) => $o->where('batching_plant_id', $plantId)->visibleTo($user),
            ))
            ->tap(fn (Builder $q) => $this->withOrderStats($q, $user))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/customer/index', [
            'customers' => $customers,
            'plants' => BatchingPlant::query()->visibleTo($user)->where('is_active', true)->orderBy('name')->get(['id', 'uuid', 'code', 'name']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'batching_plant_id' => $plantId,
            ],
            'can_toggle' => $user->hasFullPlantAccess(),
        ]);
    }

    public function show(Request $request, Customer $customer): Response
    {
        $user = $request->user();

        abort_unless(
            Customer::query()->visibleTo($user)->whereKey($customer->id)->exists(),
            403,
            'Pelanggan ini tidak memiliki pesanan di batching plant Anda.'
        );

        $stats = Customer::query()
            ->whereKey($customer->id)
            ->tap(fn (Builder $q) => $this->withOrderStats($q, $user))
            ->first();

        $orders = $customer->orders()
            ->visibleTo($user)
            ->with('batchingPlant:id,uuid,code,name')
            ->orderByDesc('id')
            ->paginate(10, ['id', 'uuid', 'code', 'project_title', 'batching_plant_id', 'total_price', 'payment_status', 'status', 'created_at'])
            ->withQueryString();

        return Inertia::render('modules/customer/show', [
            'customer' => $customer->only(['id', 'uuid', 'name', 'phone', 'email', 'is_active', 'created_at']),
            'stats' => [
                'orders_count' => (int) $stats->orders_count,
                'orders_total' => (float) ($stats->orders_total ?? 0),
                'last_order_at' => $stats->last_order_at,
            ],
            'orders' => $orders,
            'can_toggle' => $user->hasFullPlantAccess(),
        ]);
    }

    public function toggleActive(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless(
            $request->user()->hasFullPlantAccess(),
            403,
            'Hanya admin yang dapat mengubah status akun pelanggan.'
        );

        $customer->update(['is_active' => ! $customer->is_active]);

        if (! $customer->is_active) {
            // Paksa keluar dari aplikasi mobile.
            $customer->tokens()->delete();
        }

        return back()->with('success', $customer->is_active
            ? "Akun {$customer->name} diaktifkan kembali."
            : "Akun {$customer->name} dinonaktifkan.");
    }

    /**
     * Jumlah order, total belanja (tanpa yang dibatalkan), dan order terakhir —
     * hanya dari order yang boleh dilihat user.
     */
    private function withOrderStats(Builder $query, User $user): void
    {
        $query
            ->withCount(['orders as orders_count' => fn (Builder $o) => $o->visibleTo($user)])
            ->withSum(['orders as orders_total' => fn (Builder $o) => $o->visibleTo($user)->where('status', '!=', 'CANCELLED')], 'total_price')
            ->withMax(['orders as last_order_at' => fn (Builder $o) => $o->visibleTo($user)], 'created_at');
    }
}
