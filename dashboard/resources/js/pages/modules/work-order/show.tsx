import { Head, Link } from '@inertiajs/react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Building2, Calendar, Factory, FileSpreadsheet, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type WorkOrderDetail = {
    id: number;
    uuid: string;
    code: string;
    scheduled_date: string;
    scheduled_time_slot: string | null;
    target_quantity: number;
    produced_quantity: number;
    dispatched_quantity: number;
    unit: string;
    status: string;
    batch_recipe_code: string | null;
    slump_target: string | null;
    production_notes: string | null;
    created_at: string;
    order: {
        id: number;
        uuid: string;
        code: string;
        customer_name: string;
        project_title: string;
        delivery_address: string;
    };
    product?: {
        name: string;
        code: string;
        category: string;
    };
    batching_plant: {
        id: number;
        code: string;
        name: string;
        branch?: { name: string };
    };
    assigned_user?: {
        name: string;
        code: string;
    };
};

export default function WorkOrderShow({ workOrder }: { workOrder: WorkOrderDetail }) {
    const target = Number(workOrder.target_quantity) || 0;
    const dispatched = Number(workOrder.dispatched_quantity) || 0;
    const percent = target > 0 ? Math.min(100, Math.round((dispatched / target) * 100)) : 0;
    const isFulfilled = dispatched >= target && target > 0;

    return (
        <>
            <Head title={`Work Order ${workOrder.code}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                            <Link href="/production/work-orders">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-[#0c1d37] dark:text-white">
                                    {workOrder.code}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    isFulfilled
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : dispatched > 0
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                    {isFulfilled ? 'Tuntas Terpenuhi' : dispatched > 0 ? `Dikirim ${percent}%` : 'Antrian Dispatch'}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                                {workOrder.order?.project_title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="bg-[#0c1d37] hover:bg-[#162e55] text-white rounded-xl h-9.5 px-4 text-xs font-bold shadow-md shadow-[#0c1d37]/15">
                            <Link href={`/dispatch/surat-jalan/create?batching_plant_id=${workOrder.batching_plant.id}`}>
                                <Truck className="size-3.5 mr-1.5" /> Terbitkan Surat Jalan
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Production Specification Box */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Spesifikasi & Mutu Batching
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Produk / Mutu Beton:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{workOrder.product?.name}</p>
                                    <span className="font-mono text-xs text-slate-500">{workOrder.product?.code}</span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400">Target Volume Produksi:</span>
                                    <p className="text-base font-bold text-slate-900 dark:text-white">
                                        {Number(workOrder.target_quantity)} {workOrder.unit}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400">Kode Resep Mix Design:</span>
                                    <p className="font-mono text-sm font-semibold text-purple-700 dark:text-purple-300">
                                        {workOrder.batch_recipe_code || 'STANDAR-TONASA'}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400">Target Slump Pengujian:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {workOrder.slump_target || '12 ± 2 cm'}
                                    </p>
                                </div>

                                {workOrder.production_notes && (
                                    <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400">Instruksi Produksi & QC:</span>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                                            {workOrder.production_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Fulfillment */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Realisasi Produksi & Pengiriman Armada
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-3 text-center">
                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-xs text-slate-500">Target SPK</span>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                        {Number(workOrder.target_quantity)} {workOrder.unit}
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                                    <span className="text-xs text-purple-700 dark:text-purple-300">Hasil Batching</span>
                                    <p className="text-xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                                        {Number(workOrder.produced_quantity)} {workOrder.unit}
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                                    <span className="text-xs text-emerald-700 dark:text-emerald-300">Telah Dispatched</span>
                                    <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                                        {Number(workOrder.dispatched_quantity)} {workOrder.unit}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Plant & Reference Order */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Lokasi Plant & Pelaksana
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Batching Plant:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{workOrder.batching_plant.name}</p>
                                    <span className="font-mono text-xs text-slate-500">{workOrder.batching_plant.code}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Jadwal Produksi:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(workOrder.scheduled_date)}</p>
                                    <span className="text-xs text-slate-500">{workOrder.scheduled_time_slot || 'Reguler'}</span>
                                </div>
                                {workOrder.assigned_user && (
                                    <div>
                                        <span className="text-xs text-slate-400">Operator Penanggung Jawab:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{workOrder.assigned_user.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Rujukan Sales Order
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Nomor SO:</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white">{workOrder.order?.code}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Pelanggan:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{workOrder.order?.customer_name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Alamat Pengecoran:</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">{workOrder.order?.delivery_address}</p>
                                </div>
                                <div className="pt-3">
                                    <Button asChild size="sm" variant="outline" className="w-full text-xs">
                                        <Link href={`/sales/orders/${workOrder.order?.uuid}`}>Buka Sales Order</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

WorkOrderShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Work Orders', href: '/production/work-orders' },
        { title: 'Detail SPK', href: '#' },
    ],
};
