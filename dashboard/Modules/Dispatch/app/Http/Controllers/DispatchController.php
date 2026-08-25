<?php

namespace Modules\Dispatch\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Dispatch\Http\Requests\StoreSuratJalanRequest;
use Modules\Dispatch\Http\Requests\UpdateSuratJalanStatusRequest;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Services\CodeGenerator;
use Modules\WorkOrder\Models\WorkOrder;

class DispatchController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $plantId = $request->input('batching_plant_id');

        $suratJalans = SuratJalan::query()
            ->with([
                'batchingPlant:id,uuid,code,name',
                'items.product:id,uuid,code,name,unit',
                'items.order:id,uuid,code,customer_name,project_title',
            ])
            ->withCount('items')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('code', 'like', "%{$search}%")
                        ->orWhere('vehicle_number', 'like', "%{$search}%")
                        ->orWhere('driver_name', 'like', "%{$search}%")
                        ->orWhere('nota_timbangan_number', 'like', "%{$search}%")
                        ->orWhereHas('items', function ($sub) use ($search) {
                            $sub->where('destination_customer_name', 'like', "%{$search}%")
                                ->orWhere('destination_project_title', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/dispatch/index', [
            'suratJalans' => $suratJalans,
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'statuses' => [
                ['value' => 'PREPARED', 'label' => 'Siap Berangkat'],
                ['value' => 'DEPARTED', 'label' => 'Berangkat dari Plant'],
                ['value' => 'ON_THE_WAY', 'label' => 'Dalam Perjalanan'],
                ['value' => 'ARRIVED', 'label' => 'Tiba di Lokasi Proyek'],
                ['value' => 'UNLOADING', 'label' => 'Sedang Pengecoran / Bongkar'],
                ['value' => 'COMPLETED', 'label' => 'Pengantaran Selesai'],
                ['value' => 'RETURNED', 'label' => 'Armada Kembali ke Plant'],
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'batching_plant_id' => $plantId,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $plantId = $request->input('batching_plant_id');

        $activeOrders = Order::query()
            ->whereNotIn('status', ['COMPLETED', 'CANCELLED'])
            ->with([
                'items.product',
                'workOrders' => fn ($q) => $q->whereNotIn('status', ['COMPLETED', 'CANCELLED']),
            ])
            ->when($plantId, fn ($q) => $q->where('batching_plant_id', $plantId))
            ->orderByDesc('id')
            ->get();

        return Inertia::render('modules/dispatch/form', [
            'plants' => BatchingPlant::query()->where('is_active', true)->orderBy('code')->get(['id', 'uuid', 'code', 'name']),
            'activeOrders' => $activeOrders,
            'vehicleTypes' => [
                ['value' => 'MIXER_TRUCK_7M3', 'label' => 'Truk Mixer Standar (Kapasitas 7 m³)'],
                ['value' => 'BULK_CARRIER_300T', 'label' => 'Truk Kapsul / Kapal Bulk Semen Curah (Max 300 Ton)'],
                ['value' => 'FLATBED_SAK', 'label' => 'Truk Flatbed / Bak Semen Sak & Mortar (Max 200 Sak)'],
                ['value' => 'LIGHT_TRUCK', 'label' => 'Truk Ringan / Pick-up Proyek'],
            ],
        ]);
    }

    public function store(StoreSuratJalanRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $plant = BatchingPlant::findOrFail($data['batching_plant_id']);
        $sjCode = $codes->nextSuratJalanCode($plant->code);

        DB::transaction(function () use ($data, $sjCode, $plant) {
            $suratJalan = SuratJalan::create([
                'code' => $sjCode,
                'batching_plant_id' => $plant->id,
                'vehicle_number' => $data['vehicle_number'],
                'vehicle_type' => $data['vehicle_type'],
                'driver_name' => $data['driver_name'],
                'driver_phone' => $data['driver_phone'] ?? null,
                'status' => 'DEPARTED',
                'departure_time' => now(),
                'gross_weight_kg' => $data['gross_weight_kg'] ?? null,
                'tare_weight_kg' => $data['tare_weight_kg'] ?? null,
                'net_weight_kg' => $data['net_weight_kg'] ?? null,
                'nota_timbangan_number' => $data['nota_timbangan_number'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                SuratJalanItem::create([
                    'surat_jalan_id' => $suratJalan->id,
                    'order_id' => $item['order_id'],
                    'work_order_id' => $item['work_order_id'] ?? null,
                    'product_id' => $item['product_id'],
                    'quantity_delivered' => $item['quantity_delivered'],
                    'unit' => $product->unit,
                    'destination_customer_name' => $item['destination_customer_name'],
                    'destination_project_title' => $item['destination_project_title'] ?? null,
                    'destination_address' => $item['destination_address'],
                    'destination_lat' => $item['destination_lat'] ?? null,
                    'destination_lng' => $item['destination_lng'] ?? null,
                    'delivery_sequence' => $item['delivery_sequence'],
                    'status' => 'ON_TRUCK',
                    'notes' => $item['notes'] ?? null,
                ]);

                // Update order item fulfilled quantity
                $orderItem = OrderItem::where('order_id', $item['order_id'])
                    ->where('product_id', $item['product_id'])
                    ->first();

                if ($orderItem) {
                    $newFulfilled = (float) $orderItem->fulfilled_quantity + (float) $item['quantity_delivered'];
                    $orderItem->update(['fulfilled_quantity' => $newFulfilled]);

                    $order = Order::with('items')->find($item['order_id']);
                    if ($order) {
                        $allFulfilled = $order->items->every(fn ($i) => (float) $i->fulfilled_quantity >= (float) $i->quantity);
                        $order->update([
                            'status' => $allFulfilled ? 'COMPLETED' : 'PARTIAL_DELIVERY',
                        ]);
                    }
                }

                // Update work order dispatched quantity
                if (! empty($item['work_order_id'])) {
                    $wo = WorkOrder::find($item['work_order_id']);
                    if ($wo) {
                        $newDispatched = (float) $wo->dispatched_quantity + (float) $item['quantity_delivered'];
                        $woStatus = $newDispatched >= (float) $wo->target_quantity ? 'COMPLETED' : 'IN_PRODUCTION';
                        $wo->update([
                            'dispatched_quantity' => $newDispatched,
                            'status' => $woStatus,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('surat-jalan.index')->with('success', "Surat Jalan {$sjCode} berhasil diterbitkan.");
    }

    public function show(SuratJalan $suratJalan): Response
    {
        $suratJalan->load([
            'batchingPlant.branch',
            'items.product',
            'items.order',
            'items.workOrder',
        ]);

        return Inertia::render('modules/dispatch/show', [
            'suratJalan' => $suratJalan,
        ]);
    }

    public function printView(SuratJalan $suratJalan): Response
    {
        $suratJalan->load([
            'batchingPlant.branch',
            'items.product',
            'items.order',
            'items.workOrder',
        ]);

        return Inertia::render('modules/dispatch/print', [
            'suratJalan' => $suratJalan,
        ]);
    }

    public function updateStatus(UpdateSuratJalanStatusRequest $request, SuratJalan $suratJalan): RedirectResponse
    {
        $data = $request->validated();
        $status = $data['status'];

        $updateData = ['status' => $status];
        if ($status === 'ARRIVED' && empty($suratJalan->arrival_time)) {
            $updateData['arrival_time'] = now();
        }

        $suratJalan->update($updateData);

        if ($status === 'COMPLETED') {
            $suratJalan->items()->update([
                'status' => 'DELIVERED',
                'recipient_name' => $data['recipient_name'] ?? 'Penerima Lapangan',
                'received_at' => $data['received_at'] ?? now(),
            ]);
        }

        return redirect()->route('surat-jalan.show', $suratJalan)->with('success', 'Status Surat Jalan berhasil diperbarui.');
    }
}
