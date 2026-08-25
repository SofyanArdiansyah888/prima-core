import { Head, Link, router } from '@inertiajs/react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Building2, CheckCircle2, Clock, MapPin, Printer, Scale, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type SuratJalanDetail = {
    id: number;
    uuid: string;
    code: string;
    vehicle_number: string;
    vehicle_type: string;
    driver_name: string;
    driver_phone: string | null;
    status: string;
    departure_time: string | null;
    arrival_time: string | null;
    gross_weight_kg: number | null;
    tare_weight_kg: number | null;
    net_weight_kg: number | null;
    nota_timbangan_number: string | null;
    notes: string | null;
    created_at: string;
    batching_plant: {
        id: number;
        code: string;
        name: string;
        phone: string | null;
        branch?: { name: string };
    };
    items: {
        id: number;
        quantity_delivered: number;
        unit: string;
        destination_customer_name: string;
        destination_project_title: string | null;
        destination_address: string;
        delivery_sequence: number;
        status: string;
        recipient_name: string | null;
        received_at: string | null;
        product: { id: number; code: string; name: string; category: string };
        order?: { id: number; uuid: string; code: string };
        work_order?: { id: number; uuid: string; code: string };
    }[];
};

import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function DispatchShow({ suratJalan }: { suratJalan: SuratJalanDetail }) {
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
        variant: 'emerald',
    });

    const triggerStatusUpdate = (newStatus: string) => {
        let title = 'Konfirmasi Status Pengantaran';
        let desc = `Perbarui status pengantaran armada ${suratJalan.vehicle_number} menjadi "${newStatus}"?`;
        let variant: 'emerald' | 'purple' | 'amber' | 'destructive' = 'emerald';

        if (newStatus === 'ON_THE_WAY') {
            title = 'Armada Dalam Perjalanan';
            desc = `Tandai armada ${suratJalan.vehicle_number} telah berangkat dan sedang dalam perjalanan menuju lokasi proyek?`;
            variant = 'purple';
        } else if (newStatus === 'ARRIVED') {
            title = 'Armada Tiba di Proyek';
            desc = `Konfirmasi armada telah tiba di lokasi penerima proyek?`;
            variant = 'emerald';
        } else if (newStatus === 'COMPLETED') {
            title = 'Selesaikan Pengantaran (Serah Terima)';
            desc = `Konfirmasi seluruh material telah dibongkar dan diterima oleh pihak proyek?`;
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
        router.put(`/dispatch/surat-jalan/${suratJalan.uuid}/status`, {
            status: confirmDialog.newStatus,
            recipient_name: confirmDialog.newStatus === 'COMPLETED' ? 'Penerima Lapangan Proyek' : null,
        });
    };

    return (
        <>
            <Head title={`Surat Jalan ${suratJalan.code}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                            <Link href="/dispatch/surat-jalan">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{suratJalan.code}</span>
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    {suratJalan.status}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                                Armada: {suratJalan.vehicle_number} · Driver: {suratJalan.driver_name}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Terbit: {formatDateTime(suratJalan.created_at)}
                                {suratJalan.departure_time && ` · Berangkat: ${formatDateTime(suratJalan.departure_time)}`}
                                {suratJalan.arrival_time && ` · Tiba: ${formatDateTime(suratJalan.arrival_time)}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {suratJalan.status === 'DEPARTED' && (
                            <Button size="sm" onClick={() => triggerStatusUpdate('ON_THE_WAY')} className="bg-purple-600 text-white text-xs">
                                <Truck className="size-3.5" /> Dalam Perjalanan
                            </Button>
                        )}
                        {suratJalan.status === 'ON_THE_WAY' && (
                            <Button size="sm" onClick={() => triggerStatusUpdate('ARRIVED')} className="bg-indigo-600 text-white text-xs">
                                <MapPin className="size-3.5" /> Tiba di Proyek
                            </Button>
                        )}
                        {suratJalan.status === 'ARRIVED' && (
                            <Button size="sm" onClick={() => triggerStatusUpdate('COMPLETED')} className="bg-emerald-600 text-white text-xs">
                                <CheckCircle2 className="size-3.5" /> Selesaikan Pengantaran
                            </Button>
                        )}
                        <Button asChild size="sm" className="bg-slate-800 text-white hover:bg-slate-900 text-xs">
                            <Link href={`/dispatch/surat-jalan/${suratJalan.uuid}/print`} target="_blank">
                                <Printer className="size-3.5" /> Cetak Dokumen SJ
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Driver, Weighing & Telematics */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Driver & Truck Info */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 space-y-3 text-sm">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-3 dark:border-slate-800">
                                Info Armada Pengangkut
                            </h2>
                            <div>
                                <span className="text-xs text-slate-400">Nomor Polisi & Jenis:</span>
                                <p className="font-mono font-bold text-slate-900 dark:text-white">{suratJalan.vehicle_number}</p>
                                <span className="text-xs text-slate-500">{suratJalan.vehicle_type}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">Pengemudi (Driver):</span>
                                <p className="font-semibold text-slate-900 dark:text-white">{suratJalan.driver_name}</p>
                                <span className="font-mono text-xs text-slate-500">{suratJalan.driver_phone || '—'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">Batching Plant Asal:</span>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{suratJalan.batching_plant.name}</p>
                            </div>
                        </div>

                        {/* Weight scale */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 space-y-2 text-sm">
                            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2 dark:border-slate-800">
                                <Scale className="size-4 text-emerald-600" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    Nota Timbangan
                                </h2>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>No. Nota Timbang:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{suratJalan.nota_timbangan_number || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Berat Bruto (Gross):</span>
                                <span className="font-mono font-semibold text-slate-900 dark:text-white">{Number(suratJalan.gross_weight_kg || 0).toLocaleString('id-ID')} Kg</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Berat Tara (Kosong):</span>
                                <span className="font-mono font-semibold text-slate-900 dark:text-white">{Number(suratJalan.tare_weight_kg || 0).toLocaleString('id-ID')} Kg</span>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                <span>Berat Netto Muatan:</span>
                                <span className="font-mono">{Number(suratJalan.net_weight_kg || 0).toLocaleString('id-ID')} Kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Delivery Stops and Ordered Cargo */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Rute & Muatan Pengantaran (Delivery Stops)
                            </h2>

                            <div className="space-y-4">
                                {suratJalan.items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                                    Drop #{item.delivery_sequence}
                                                </span>
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {item.destination_customer_name}
                                                </span>
                                                {item.destination_project_title && (
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        ({item.destination_project_title})
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                Status: {item.status}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                            <div>
                                                <span className="text-slate-400">Material Muatan:</span>
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {Number(item.quantity_delivered)} {item.unit} {item.product.name}
                                                </p>
                                                <span className="font-mono text-slate-400">{item.product.code}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Alamat Penerimaan:</span>
                                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                                    {item.destination_address}
                                                </p>
                                            </div>
                                        </div>

                                        {item.recipient_name && (
                                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex justify-between text-xs text-slate-500">
                                                <span>Penerima: <strong className="text-slate-800 dark:text-slate-200">{item.recipient_name}</strong></span>
                                                <span>Waktu Diterima: {formatDateTime(item.received_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
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
                    confirmText="Ya, Perbarui Status"
                    cancelText="Batal"
                    onConfirm={handleConfirmStatus}
                />
            </div>
        </>
    );
}

DispatchShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Surat Jalan', href: '/dispatch/surat-jalan' },
        { title: 'Detail Pengantaran', href: '#' },
    ],
};
