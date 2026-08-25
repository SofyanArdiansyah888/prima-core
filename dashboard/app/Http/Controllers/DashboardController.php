<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $plants = BatchingPlant::query()
            ->where('is_active', true)
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->get(['id', 'uuid', 'code', 'name', 'address', 'phone', 'lat', 'lng', 'status', 'daily_capacity_m3']);

        $activeDeliveries = SuratJalanItem::query()
            ->with([
                'suratJalan:id,uuid,code,vehicle_number,vehicle_type,driver_name,driver_phone,status,batching_plant_id',
                'suratJalan.batchingPlant:id,code,name,lat,lng',
                'product:id,code,name,category,unit',
            ])
            ->whereNotNull('destination_lat')
            ->whereNotNull('destination_lng')
            ->orderBy('id', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'surat_jalan_code' => $item->suratJalan?->code,
                    'surat_jalan_uuid' => $item->suratJalan?->uuid,
                    'vehicle_number' => $item->suratJalan?->vehicle_number,
                    'driver_name' => $item->suratJalan?->driver_name,
                    'driver_phone' => $item->suratJalan?->driver_phone,
                    'status' => $item->status,
                    'dispatch_status' => $item->suratJalan?->status,
                    'delivery_sequence' => $item->delivery_sequence,
                    'customer_name' => $item->destination_customer_name,
                    'project_title' => $item->destination_project_title,
                    'destination_address' => $item->destination_address,
                    'lat' => (float) $item->destination_lat,
                    'lng' => (float) $item->destination_lng,
                    'product_name' => $item->product?->name,
                    'product_code' => $item->product?->code,
                    'quantity' => (float) $item->quantity_delivered,
                    'unit' => $item->unit,
                    'plant_name' => $item->suratJalan?->batchingPlant?->name,
                    'plant_lat' => (float) ($item->suratJalan?->batchingPlant?->lat ?? 0),
                    'plant_lng' => (float) ($item->suratJalan?->batchingPlant?->lng ?? 0),
                ];
            });

        $recentOrders = Order::query()
            ->with(['batchingPlant:id,name,code', 'items.product:id,name,unit'])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $recentDispatches = SuratJalan::query()
            ->with(['batchingPlant:id,name,code', 'items.product:id,name,unit'])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'branches' => Branch::query()->where('is_active', true)->count(),
                'plants' => BatchingPlant::query()->where('is_active', true)->count(),
                'users' => User::query()->where('is_active', true)->count(),
                'orders' => Order::query()->count(),
                'workOrders' => WorkOrder::query()->count(),
                'dispatches' => SuratJalan::query()->count(),
                'products' => Product::query()->where('is_active', true)->count(),
            ],
            'plants' => $plants,
            'activeDeliveries' => $activeDeliveries,
            'recentOrders' => $recentOrders,
            'recentDispatches' => $recentDispatches,
        ]);
    }
}
