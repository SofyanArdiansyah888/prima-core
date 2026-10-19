<?php

namespace App\Http\Controllers;

use App\Exports\TabularExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Order\Models\Order;
use Modules\WorkOrder\Models\WorkOrder;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ReportController extends Controller
{
    public function sales(Request $request): Response
    {
        return $this->page($request, 'sales');
    }

    public function production(Request $request): Response
    {
        return $this->page($request, 'production');
    }

    public function dispatch(Request $request): Response
    {
        return $this->page($request, 'dispatch');
    }

    public function salesExcel(Request $request): BinaryFileResponse
    {
        return $this->excel($request, 'sales');
    }

    public function productionExcel(Request $request): BinaryFileResponse
    {
        return $this->excel($request, 'production');
    }

    public function dispatchExcel(Request $request): BinaryFileResponse
    {
        return $this->excel($request, 'dispatch');
    }

    public function salesPdf(Request $request): HttpResponse
    {
        return $this->pdf($request, 'sales');
    }

    public function productionPdf(Request $request): HttpResponse
    {
        return $this->pdf($request, 'production');
    }

    public function dispatchPdf(Request $request): HttpResponse
    {
        return $this->pdf($request, 'dispatch');
    }

    private function page(Request $request, string $kind): Response
    {
        $payload = $this->build($request, $kind);

        return Inertia::render('modules/report/index', [
            'kind' => $kind,
            'title' => $payload['title'],
            'periodLabel' => $payload['periodLabel'],
            'filters' => $payload['filters'],
            'plants' => $payload['plants'],
            'metrics' => $payload['metrics'],
            'records' => $payload['records'],
            'headings' => $payload['headings'],
            'rows' => $payload['rows'],
        ]);
    }

    private function excel(Request $request, string $kind): BinaryFileResponse
    {
        $payload = $this->build($request, $kind);

        return Excel::download(
            new TabularExport($payload['headings'], $payload['rows']),
            $payload['filename'].'.xlsx',
        );
    }

    private function pdf(Request $request, string $kind): HttpResponse
    {
        $payload = $this->build($request, $kind);
        $pdf = Pdf::loadView('reports.summary', [
            'title' => $payload['title'],
            'period' => $payload['periodLabel'],
            'metrics' => array_slice($payload['metrics'], 0, 4),
            'headings' => $payload['headings'],
            'rows' => array_slice($payload['rows'], 0, 50),
        ]);

        return $pdf->download($payload['filename'].'.pdf');
    }

    private function build(Request $request, string $kind): array
    {
        Carbon::setLocale('id');

        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();
        if ($from->greaterThan($to)) {
            [$from, $to] = [$to, $from];
        }
        $plantId = $request->integer('batching_plant_id') ?: null;

        $plants = BatchingPlant::query()
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(fn (BatchingPlant $plant) => [
                'id' => $plant->id,
                'code' => $plant->code,
                'name' => $plant->name,
            ])
            ->all();

        $built = match ($kind) {
            'production' => $this->productionData($from, $to, $plantId),
            'dispatch' => $this->dispatchData($from, $to, $plantId),
            default => $this->salesData($from, $to, $plantId),
        };

        $periodLabel = $this->formatIndonesianDate($from).' s/d '.$this->formatIndonesianDate($to);

        return [
            ...$built,
            'periodLabel' => $periodLabel,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'batching_plant_id' => $plantId ? (string) $plantId : '',
            ],
            'plants' => $plants,
        ];
    }

    private function salesData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $orders = Order::query()
            ->with([
                'batchingPlant:id,code,name',
                'items.product:id,code,name,unit',
            ])
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        $completedCount = $orders->where('status', 'COMPLETED')->count();
        $totalOrders = $orders->count();
        $completionRate = $totalOrders > 0 ? round(($completedCount / $totalOrders) * 100) : 0;
        $totalRevenue = (float) $orders->sum('total_price');
        $paidRevenue = (float) $orders->where('payment_status', 'PAID')->sum('total_price');

        $records = $orders->map(fn (Order $o) => [
            'id' => $o->id,
            'uuid' => $o->uuid,
            'code' => $o->code,
            'customer_name' => $o->customer_name,
            'project_title' => $o->project_title ?? '—',
            'plant_code' => $o->batchingPlant?->code ?? '—',
            'plant_name' => $o->batchingPlant?->name ?? '—',
            'status' => $o->status,
            'status_label' => $this->orderStatusLabel($o->status),
            'payment_status' => $o->payment_status,
            'payment_status_label' => $this->paymentStatusLabel($o->payment_status),
            'total_price' => (float) $o->total_price,
            'created_at' => $o->created_at?->toISOString(),
            'formatted_date' => $this->formatIndonesianDate($o->created_at),
            'formatted_time' => $o->created_at?->format('H:i').' WITA',
            'item_names' => $o->items->map(fn ($i) => $i->product?->name)->filter()->join(', '),
        ])->all();

        $rows = $orders->map(fn (Order $o) => [
            $o->code,
            $this->formatIndonesianDate($o->created_at).' '.$o->created_at?->format('H:i'),
            $o->customer_name,
            $o->project_title ?? '—',
            $o->batchingPlant?->name ?? '—',
            $this->orderStatusLabel($o->status),
            $this->paymentStatusLabel($o->payment_status),
            (float) $o->total_price,
        ])->all();

        return [
            'title' => 'Laporan Pesanan & Penjualan',
            'filename' => 'laporan-penjualan-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Total Pesanan', 'value' => (string) $totalOrders, 'desc' => 'Transaksi masuk'],
                ['label' => 'Total Nilai Penjualan', 'value' => 'Rp '.number_format($totalRevenue, 0, ',', '.'), 'desc' => 'Gross tagihan pesanan'],
                ['label' => 'Selesai Terpenuhi', 'value' => "{$completedCount} ({$completionRate}%)", 'desc' => 'Tuntas terkirim 100%'],
                ['label' => 'Pembayaran Lunas', 'value' => 'Rp '.number_format($paidRevenue, 0, ',', '.'), 'desc' => 'Terverifikasi Midtrans/Kredit'],
            ],
            'records' => $records,
            'headings' => ['Kode Pesanan', 'Tanggal Pesanan', 'Pelanggan', 'Proyek', 'Plant', 'Status Pesanan', 'Status Bayar', 'Nilai Total (Rp)'],
            'rows' => $rows,
        ];
    }

    private function productionData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $workOrders = WorkOrder::query()
            ->with([
                'batchingPlant:id,code,name',
                'product:id,code,name,unit',
                'order:id,uuid,code,customer_name,project_title',
                'assignedUser:id,name',
            ])
            ->whereDate('scheduled_date', '>=', $from->toDateString())
            ->whereDate('scheduled_date', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('scheduled_date')
            ->limit(500)
            ->get();

        $totalWos = $workOrders->count();
        $totalTarget = (float) $workOrders->sum('target_quantity');
        $totalDispatched = (float) $workOrders->sum('dispatched_quantity');
        $fulfilledWos = $workOrders->filter(fn ($w) => (float) $w->dispatched_quantity >= (float) $w->target_quantity && (float) $w->target_quantity > 0)->count();
        $dispatchedPercent = $totalTarget > 0 ? min(100, round(($totalDispatched / $totalTarget) * 100)) : 0;

        $records = $workOrders->map(function (WorkOrder $wo) {
            $target = (float) $wo->target_quantity;
            $dispatched = (float) $wo->dispatched_quantity;
            $percent = $target > 0 ? min(100, round(($dispatched / $target) * 100)) : 0;
            $statusLabel = $percent >= 100 ? 'Tuntas Terpenuhi' : ($dispatched > 0 ? "Dikirim {$percent}%" : 'Antrean Batching');

            return [
                'id' => $wo->id,
                'uuid' => $wo->uuid,
                'code' => $wo->code,
                'order_code' => $wo->order?->code,
                'order_uuid' => $wo->order?->uuid,
                'customer_name' => $wo->order?->customer_name ?? '—',
                'project_title' => $wo->order?->project_title ?? '—',
                'plant_code' => $wo->batchingPlant?->code ?? '—',
                'plant_name' => $wo->batchingPlant?->name ?? '—',
                'product_name' => $wo->product?->name ?? '—',
                'product_code' => $wo->product?->code ?? '—',
                'recipe_code' => $wo->batch_recipe_code ?? 'STANDAR-TONASA',
                'scheduled_date' => $wo->scheduled_date?->toDateString(),
                'formatted_date' => $this->formatIndonesianDate($wo->scheduled_date),
                'time_slot' => $wo->scheduled_time_slot ?? 'Slot Reguler',
                'target_quantity' => $target,
                'produced_quantity' => (float) $wo->produced_quantity,
                'dispatched_quantity' => $dispatched,
                'unit' => $wo->unit ?: 'm³',
                'progress_percent' => $percent,
                'status_label' => $statusLabel,
                'assigned_user_name' => $wo->assignedUser?->name ?? '—',
            ];
        })->all();

        $rows = $workOrders->map(function (WorkOrder $wo) {
            $target = (float) $wo->target_quantity;
            $dispatched = (float) $wo->dispatched_quantity;
            $percent = $target > 0 ? min(100, round(($dispatched / $target) * 100)) : 0;
            $statusLabel = $percent >= 100 ? 'Tuntas Terpenuhi' : ($dispatched > 0 ? "Dikirim {$percent}%" : 'Antrean Batching');

            return [
                $wo->code,
                $this->formatIndonesianDate($wo->scheduled_date),
                $wo->scheduled_time_slot ?? 'Slot Reguler',
                ($wo->order?->customer_name ?? '—').($wo->order?->project_title ? " · {$wo->order->project_title}" : ''),
                $wo->batchingPlant?->name ?? '—',
                $wo->product?->name ?? '—',
                $target,
                $dispatched,
                $wo->unit ?: 'm³',
                $statusLabel,
            ];
        })->all();

        return [
            'title' => 'Laporan Produksi Batching (SPK)',
            'filename' => 'laporan-produksi-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Total SPK Terbit', 'value' => (string) $totalWos, 'desc' => 'Tiket produksi aktif'],
                ['label' => 'Target Volume', 'value' => number_format($totalTarget, 2, ',', '.').' m³', 'desc' => 'Target mix design'],
                ['label' => 'Volume Terkirim', 'value' => number_format($totalDispatched, 2, ',', '.')." m³ ({$dispatchedPercent}%)", 'desc' => 'Realisasi armada'],
                ['label' => 'SPK Tuntas (100%)', 'value' => (string) $fulfilledWos, 'desc' => 'Target terpenuhi penuh'],
            ],
            'records' => $records,
            'headings' => ['Kode SPK', 'Tanggal Jadwal', 'Slot Waktu', 'Pelanggan / Proyek', 'Plant', 'Mutu Beton', 'Target', 'Terkirim', 'Satuan', 'Progres Pemenuhan'],
            'rows' => $rows,
        ];
    }

    private function dispatchData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $letters = SuratJalan::query()
            ->with([
                'batchingPlant:id,code,name',
                'items.product:id,code,name,unit',
                'items.order:id,uuid,code,customer_name,project_title',
            ])
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        $totalSj = $letters->count();
        $inTransit = $letters->where('status', 'ON_THE_WAY')->count();
        $deliveredSj = $letters->where('status', 'COMPLETED')->count();
        $totalVolume = (float) $letters->flatMap->items->sum('quantity_delivered');

        $records = $letters->map(function (SuratJalan $sj) {
            $firstItem = $sj->items->first();
            $totalDelivered = (float) $sj->items->sum('quantity_delivered');
            $unit = $firstItem?->unit ?: 'm³';

            return [
                'id' => $sj->id,
                'uuid' => $sj->uuid,
                'code' => $sj->code,
                'vehicle_number' => $sj->vehicle_number,
                'vehicle_type' => $sj->vehicle_type,
                'driver_name' => $sj->driver_name,
                'driver_phone' => $sj->driver_phone,
                'plant_code' => $sj->batchingPlant?->code ?? '—',
                'plant_name' => $sj->batchingPlant?->name ?? '—',
                'customer_name' => $firstItem?->destination_customer_name ?? $firstItem?->order?->customer_name ?? '—',
                'project_title' => $firstItem?->destination_project_title ?? $firstItem?->order?->project_title ?? '—',
                'product_name' => $firstItem?->product?->name ?? '—',
                'quantity_delivered' => $totalDelivered,
                'unit' => $unit,
                'status' => $sj->status,
                'status_label' => $this->dispatchStatusLabel($sj->status),
                'created_at' => $sj->created_at?->toISOString(),
                'formatted_date' => $this->formatIndonesianDate($sj->created_at),
                'formatted_time' => $sj->departure_time ? $sj->departure_time->format('H:i').' WITA' : ($sj->created_at?->format('H:i').' WITA'),
                'recipient_name' => $firstItem?->recipient_name,
                'received_at' => $firstItem?->received_at ? $this->formatIndonesianDate($firstItem->received_at).' '.$firstItem->received_at->format('H:i') : null,
            ];
        })->all();

        $rows = $letters->map(function (SuratJalan $sj) {
            $firstItem = $sj->items->first();
            $totalDelivered = (float) $sj->items->sum('quantity_delivered');
            $unit = $firstItem?->unit ?: 'm³';
            $timeText = $sj->departure_time
                ? $this->formatIndonesianDate($sj->departure_time).' '.$sj->departure_time->format('H:i')
                : ($sj->created_at ? $this->formatIndonesianDate($sj->created_at).' '.$sj->created_at->format('H:i') : '');

            return [
                $sj->code,
                $timeText,
                $sj->vehicle_number,
                $sj->driver_name,
                $sj->batchingPlant?->name ?? '—',
                ($firstItem?->destination_customer_name ?? '').($firstItem?->destination_project_title ? " · {$firstItem->destination_project_title}" : ''),
                "{$totalDelivered} {$unit}",
                $this->dispatchStatusLabel($sj->status),
                $firstItem?->recipient_name ?? '—',
            ];
        })->all();

        return [
            'title' => 'Laporan Distribusi & Logistik Armada',
            'filename' => 'laporan-distribusi-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Total Surat Jalan', 'value' => (string) $totalSj, 'desc' => 'Total ritase diterbitkan'],
                ['label' => 'Dalam Perjalanan', 'value' => (string) $inTransit, 'desc' => 'Armada menuju proyek'],
                ['label' => 'Pengantaran Selesai', 'value' => (string) $deliveredSj, 'desc' => 'e-POD tervalidasi'],
                ['label' => 'Volume Terdistribusi', 'value' => number_format($totalVolume, 2, ',', '.').' m³', 'desc' => 'Muatan tuntas diantar'],
            ],
            'records' => $records,
            'headings' => ['Kode Surat Jalan', 'Waktu Berangkat', 'Kendaraan', 'Sopir', 'Plant', 'Pelanggan / Proyek', 'Volume Dikirim', 'Status Pengantaran', 'Penerima'],
            'rows' => $rows,
        ];
    }

    private function orderStatusLabel(?string $status): string
    {
        return match ($status) {
            'CONFIRMED', 'DRAFT' => 'Dikonfirmasi',
            'PROCESSING', 'WORK_ORDER_CREATED', 'IN_PRODUCTION' => 'Diproses (SPK Terbit)',
            'ON_DELIVERY', 'PARTIAL_DELIVERY' => 'Dalam Pengiriman',
            'COMPLETED' => 'Selesai Terpenuhi',
            'CANCELLED' => 'Dibatalkan',
            default => $status ?? '—',
        };
    }

    private function paymentStatusLabel(?string $status): string
    {
        return match ($status) {
            'PAID', 'APPROVED_CREDIT' => 'Lunas',
            'PENDING', 'CHALLENGE' => 'Menunggu Pembayaran',
            'FAILED', 'REFUNDED' => 'Gagal / Dibatalkan',
            default => $status ?? '—',
        };
    }

    private function dispatchStatusLabel(?string $status): string
    {
        return match ($status) {
            'ON_THE_WAY', 'DEPARTED' => 'Dalam Perjalanan',
            'COMPLETED' => 'Pengantaran Selesai',
            'CANCELLED' => 'Batal / Retur',
            default => $status ?? '—',
        };
    }

    private function formatIndonesianDate(?CarbonInterface $date): string
    {
        if (! $date) {
            return '—';
        }

        $months = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
            9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
        ];

        return $date->day.' '.$months[$date->month].' '.$date->year;
    }
}
