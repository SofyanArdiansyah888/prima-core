import { Head, Link, router } from '@inertiajs/react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Building2, Calendar, CheckCircle2, Factory, FileSpreadsheet, Play, Truck, User } from 'lucide-react';
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

import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function WorkOrderShow({ workOrder }: { workOrder: WorkOrderDetail }) {
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        newStatus: string;
        variant?: 'emerald' | 'purple' | 'amber' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        newStatus: '',
        variant: 'purple',
    });

    const triggerStatusChange = (newStatus: string) => {
        let variant: 'emerald' | 'purple' | 'amber' | 'destructive' = 'purple';
        let title = 'Konfirmasi Perubahan Status SPK';
        let desc = `Perbarui status Work Order ${workOrder.code} menjadi "${newStatus}"?`;

        if (newStatus === 'IN_PRODUCTION') {
            title = 'Mulai Produksi / Batching Beton';
            desc = `Mulai proses batching resep ${workOrder.batch_recipe_code || 'Standar'} untuk volume ${Number(workOrder.target_quantity)} ${workOrder.unit}?`;
            variant = 'amber';
        } else if (newStatus === 'READY_FOR_DISPATCH') {
            title = 'Set Siap Kirim (Dispatch)';
            desc = `Tandai batching selesai dan siap dimuat ke armada pengangkut?`;
            variant = 'emerald';
        }

        setConfirmDialog({
            open: true,
            title,
            description: desc,
            newStatus,
            variant,
        });
    };

    const handleConfirmStatus = () => {
        router.put(`/production/work-orders/${workOrder.uuid}/status`, {
            status: confirmDialog.newStatus,
            produced_quantity: confirmDialog.newStatus === 'COMPLETED' ? workOrder.target_quantity : workOrder.produced_quantity,
        });
    };

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
                                <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-300">
                                    {workOrder.code}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    {workOrder.status}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                                {workOrder.order?.project_title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {workOrder.status === 'SCHEDULED' && (
                            <Button
                                size="sm"
                                onClick={() => triggerStatusChange('IN_PRODUCTION')}
                                className="bg-amber-600 font-medium text-white hover:bg-amber-700 text-xs"
                            >
                                <Play className="size-3.5" /> Mulai Produksi / Batching
                            </Button>
                        )}
                        {workOrder.status === 'IN_PRODUCTION' && (
                            <Button
                                size="sm"
                                onClick={() => triggerStatusChange('READY_FOR_DISPATCH')}
                                className="bg-purple-600 font-medium text-white hover:bg-purple-700 text-xs"
                            >
                                <CheckCircle2 className="size-3.5" /> Set Siap Kirim (Dispatch)
                            </Button>
                        )}
                        <Button asChild size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs">
                            <Link href={`/dispatch/surat-jalan/create?batching_plant_id=${workOrder.batching_plant.id}`}>
                                <Truck className="size-3.5" /> Buat Surat Jalan
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

                <ConfirmModal
                    open={confirmDialog.open}
                    onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                    title={confirmDialog.title}
                    description={confirmDialog.description}
                    variant={confirmDialog.variant}
                    confirmText="Ya, Lanjutkan"
                    cancelText="Batal"
                    onConfirm={handleConfirmStatus}
                />
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
