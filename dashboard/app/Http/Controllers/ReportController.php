<?php

namespace App\Http\Controllers;

use App\Exports\TabularExport;
use Barryvdh\DomPDF\Facade\Pdf;
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
            'filters' => $payload['filters'],
            'plants' => $payload['plants'],
            'metrics' => $payload['metrics'],
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
            'period' => $payload['filters']['from'].' s/d '.$payload['filters']['to'],
            'metrics' => array_slice($payload['metrics'], 0, 3),
            'headings' => $payload['headings'],
            'rows' => array_slice($payload['rows'], 0, 25),
        ]);

        return $pdf->download($payload['filename'].'.pdf');
    }

    /**
     * @return array{
     *     title: string,
     *     filename: string,
     *     filters: array{from: string, to: string, batching_plant_id: string},
     *     plants: list<array{id: int, code: string, name: string}>,
     *     metrics: list<array{label: string, value: string}>,
     *     headings: list<string>,
     *     rows: list<list<string|int|float>>
     * }
     */
    private function build(Request $request, string $kind): array
    {
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

        return [
            ...$built,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'batching_plant_id' => $plantId ? (string) $plantId : '',
            ],
            'plants' => $plants,
        ];
    }

    /**
     * @return array{title: string, filename: string, metrics: list<array{label: string, value: string}>, headings: list<string>, rows: list<list<string|int|float>>}
     */
    private function salesData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $orders = Order::query()
            ->with('batchingPlant:id,code,name')
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('created_at')
            ->limit(300)
            ->get();

        $rows = $orders->map(fn (Order $order) => [
            $order->code,
            $order->customer_name,
            $order->batchingPlant?->code ?? '',
            $order->status,
            (float) $order->total_price,
            $order->created_at?->format('Y-m-d') ?? '',
        ])->all();

        return [
            'title' => 'Laporan Penjualan',
            'filename' => 'laporan-penjualan-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Jumlah pesanan', 'value' => (string) $orders->count()],
                ['label' => 'Nilai pesanan', 'value' => 'Rp '.number_format((float) $orders->sum('total_price'), 0, ',', '.')],
                ['label' => 'Selesai', 'value' => (string) $orders->where('status', 'COMPLETED')->count()],
            ],
            'headings' => ['Kode', 'Pelanggan', 'Plant', 'Status', 'Nilai', 'Tanggal'],
            'rows' => $rows,
        ];
    }

    /**
     * @return array{title: string, filename: string, metrics: list<array{label: string, value: string}>, headings: list<string>, rows: list<list<string|int|float>>}
     */
    private function productionData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $workOrders = WorkOrder::query()
            ->with('batchingPlant:id,code,name')
            ->whereDate('scheduled_date', '>=', $from->toDateString())
            ->whereDate('scheduled_date', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('scheduled_date')
            ->limit(300)
            ->get();

        $rows = $workOrders->map(fn (WorkOrder $workOrder) => [
            $workOrder->code,
            $workOrder->batchingPlant?->code ?? '',
            $workOrder->scheduled_date?->format('Y-m-d') ?? (string) $workOrder->scheduled_date,
            (float) $workOrder->target_quantity,
            (float) $workOrder->produced_quantity,
            $workOrder->unit,
            $workOrder->status,
        ])->all();

        return [
            'title' => 'Laporan Produksi',
            'filename' => 'laporan-produksi-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Jumlah SPK', 'value' => (string) $workOrders->count()],
                ['label' => 'Target', 'value' => number_format((float) $workOrders->sum('target_quantity'), 2, ',', '.')],
                ['label' => 'Hasil', 'value' => number_format((float) $workOrders->sum('produced_quantity'), 2, ',', '.')],
            ],
            'headings' => ['Kode', 'Plant', 'Tanggal', 'Target', 'Hasil', 'Satuan', 'Status'],
            'rows' => $rows,
        ];
    }

    /**
     * @return array{title: string, filename: string, metrics: list<array{label: string, value: string}>, headings: list<string>, rows: list<list<string|int|float>>}
     */
    private function dispatchData(CarbonInterface $from, CarbonInterface $to, ?int $plantId): array
    {
        $letters = SuratJalan::query()
            ->with('batchingPlant:id,code,name')
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $to->toDateString())
            ->when($plantId, fn ($query) => $query->where('batching_plant_id', $plantId))
            ->orderByDesc('created_at')
            ->limit(300)
            ->get();

        $rows = $letters->map(fn (SuratJalan $letter) => [
            $letter->code,
            $letter->batchingPlant?->code ?? '',
            $letter->vehicle_number,
            $letter->status,
            $letter->created_at?->format('Y-m-d') ?? '',
        ])->all();

        return [
            'title' => 'Laporan Distribusi',
            'filename' => 'laporan-distribusi-'.$from->format('Ymd').'-'.$to->format('Ymd'),
            'metrics' => [
                ['label' => 'Surat jalan', 'value' => (string) $letters->count()],
                ['label' => 'Dalam perjalanan', 'value' => (string) $letters->whereIn('status', ['DEPARTED', 'ON_THE_WAY'])->count()],
                ['label' => 'Selesai', 'value' => (string) $letters->where('status', 'COMPLETED')->count()],
            ],
            'headings' => ['Kode', 'Plant', 'Kendaraan', 'Status', 'Tanggal'],
            'rows' => $rows,
        ];
    }
}
