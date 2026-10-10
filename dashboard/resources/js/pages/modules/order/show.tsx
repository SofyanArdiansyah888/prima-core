import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Building2, Calendar, FileSpreadsheet, MapPin, Truck, CheckCircle2, Phone, Mail, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type OrderDetail = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    customer_type: string;
    project_title: string;
    delivery_address: string;
    delivery_lat: number | null;
    delivery_lng: number | null;
    distance_km: number;
    delivery_fee: number;
    subtotal: number;
    ppn: number;
    total_price: number;
    payment_method: string | null;
    payment_status: string;
    status: string;
    po_number: string | null;
    notes: string | null;
    created_at: string;
    batching_plant?: { id: number; uuid: string; code: string; name: string; branch?: { name: string } };
    items: {
        id: number;
        product_id: number;
        quantity: number;
        fulfilled_quantity: number;
        unit: string;
        unit_price: number;
        subtotal: number;
        notes: string | null;
        product: { id: number; uuid: string; code: string; name: string; category: string; max_trip_capacity: number; allow_combined_delivery: boolean };
    }[];
    work_orders: {
        id: number;
        uuid: string;
        code: string;
        status: string;
        target_quantity: number;
        produced_quantity: number;
        dispatched_quantity: number;
        scheduled_date: string;
        scheduled_time_slot: string | null;
        assigned_user?: { name: string };
    }[];
};

import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function OrderShow({ order }: { order: OrderDetail }) {
    const { put, processing } = useForm();
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

    const triggerStatusChange = (newStatus: string) => {
        let variant: 'emerald' | 'purple' | 'amber' | 'destructive' = 'emerald';
        if (newStatus === 'CANCELLED') variant = 'destructive';
        if (newStatus === 'IN_PRODUCTION') variant = 'purple';
        if (newStatus === 'CONFIRMED') variant = 'emerald';

        setConfirmDialog({
            open: true,
            title: 'Konfirmasi Perubahan Status',
            description: `Apakah Anda yakin ingin memperbarui status pesanan ${order.code} menjadi "${newStatus}"?`,
            newStatus,
            variant,
        });
    };

    const handleConfirmStatus = () => {
        router.put(`/sales/orders/${order.uuid}`, {
            status: confirmDialog.newStatus,
            payment_status: order.payment_status,
        });
    };

    return (
        <>
            <Head title={`Detail Pesanan ${order.code}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                            <Link href="/sales/orders">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{order.code}</span>
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    {order.status}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {order.payment_status}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                                {order.project_title}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dibuat: {formatDateTime(order.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="bg-purple-700 font-medium text-white hover:bg-purple-800 dark:bg-purple-600">
                            <Link href={`/production/work-orders/create?order_id=${order.id}`}>
                                <FileSpreadsheet className="size-4" /> Terbitkan Work Order (SPK)
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Customer & Project Details */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Customer Box */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Informasi Pelanggan
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Nama Pelanggan:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{order.customer_name}</p>
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-0.5">
                                        {order.customer_type}
                                    </span>
                                </div>
                                {order.customer_phone && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                        <Phone className="size-3.5 text-slate-400" />
                                        <span className="font-mono">{order.customer_phone}</span>
                                    </div>
                                )}
                                {order.customer_email && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                        <Mail className="size-3.5 text-slate-400" />
                                        <span>{order.customer_email}</span>
                                    </div>
                                )}
                                {order.po_number && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400">Nomor PO Proyek:</span>
                                        <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{order.po_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Plant & Logistics Box */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                                Alokasi Batching Plant
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <Building2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{order.batching_plant?.name}</p>
                                        <span className="font-mono text-xs text-slate-500">{order.batching_plant?.code}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="size-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Tujuan Pengantaran:</p>
                                        <p className="font-medium text-slate-900 dark:text-white text-xs">{order.delivery_address}</p>
                                        {order.delivery_lat && order.delivery_lng && (
                                            <span className="font-mono text-[11px] text-slate-400 mt-0.5 block">
                                                Koordinat: {order.delivery_lat}, {order.delivery_lng}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Jarak Tempuh:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{Number(order.distance_km)} Km</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-slate-600 dark:text-slate-400">Ongkos Kirim Plant:</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Rp {Number(order.delivery_fee).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-2 dark:border-slate-800">
                                Rincian Pembayaran
                            </h2>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Subtotal Produk:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {Number(order.subtotal).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Ongkos Kirim:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {Number(order.delivery_fee).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>PPN (11%):</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {Number(order.ppn).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                                <span>Total Tagihan:</span>
                                <span className="text-emerald-700 dark:text-emerald-400">Rp {Number(order.total_price).toLocaleString('id-ID')}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <span>Metode Bayar:</span>
                                <span className="font-semibold text-slate-900 dark:text-white uppercase">{order.payment_method || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                                <span>Status Bayar:</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    order.payment_status === 'PAID'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                }`}>
                                    {order.payment_status === 'PAID' ? 'LUNAS' : order.payment_status}
                                </span>
                            </div>

                            {order.payment_method === 'MIDTRANS' && (
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.post(`/sales/orders/${order.uuid}/sync-payment`)}
                                        className="w-full text-xs h-8 gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                    >
                                        <RefreshCw className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Sinkronkan Status Midtrans
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Ordered Items & Work Orders */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Ordered Items Table */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
                                Item Produk & Status Pemenuhan
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-3">Produk</th>
                                            <th className="px-4 py-3 text-center">Volume Pesanan</th>
                                            <th className="px-4 py-3 text-center">Terkirim</th>
                                            <th className="px-4 py-3">Harga Satuan</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {order.items.map((item) => {
                                            const percent = Math.min(100, Math.round((Number(item.fulfilled_quantity) / Number(item.quantity)) * 100));
                                            return (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3.5">
                                                        <p className="font-semibold text-slate-900 dark:text-white">{item.product.name}</p>
                                                        <span className="font-mono text-xs text-slate-500">{item.product.code}</span>
                                                        <div className="mt-1">
                                                            {item.product.allow_combined_delivery ? (
                                                                <span className="text-[11px] text-blue-600 dark:text-blue-400">
                                                                    ✓ Bisa kirim gabung customer lain
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                                                    🔒 Eksklusif 1 Customer per rit truk (Limit {item.product.max_trip_capacity} {item.unit})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                                                        {Number(item.quantity)} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                                {Number(item.fulfilled_quantity)} / {Number(item.quantity)} {item.unit}
                                                            </span>
                                                            <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 mt-0.5">{percent}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                                                        Rp {Number(item.unit_price).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                                                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Work Orders Associated */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                    Work Order / Surat Perintah Kerja (SPK) Terbit
                                </h2>
                                <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                                    <Link href={`/production/work-orders/create?order_id=${order.id}`}>
                                        <FileSpreadsheet className="size-3.5" /> Buat SPK Baru
                                    </Link>
                                </Button>
                            </div>

                            {order.work_orders.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-xs">
                                    Belum ada Work Order (SPK) yang diterbitkan untuk pesanan ini.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {order.work_orders.map((wo) => (
                                        <div
                                            key={wo.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                                                        {wo.code}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                                                        {wo.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Jadwal: {formatDate(wo.scheduled_date)} ({wo.scheduled_time_slot || 'Standar'}) · Operator: {wo.assigned_user?.name ?? '—'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right text-xs">
                                                    <span className="text-slate-400">Target / Produksi / Kirim:</span>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {Number(wo.target_quantity)} / {Number(wo.produced_quantity)} / {Number(wo.dispatched_quantity)}
                                                    </p>
                                                </div>
                                                <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                                                    <Link href={`/production/work-orders/${wo.uuid}`}>Lihat SPK</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    open={confirmDialog.open}
                    onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                    title={confirmDialog.title}
                    description={confirmDialog.description}
                    variant={confirmDialog.variant}
                    confirmText="Ya, Perbarui"
                    cancelText="Batal"
                    onConfirm={handleConfirmStatus}
                />
            </div>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pesanan & Penjualan', href: '/sales/orders' },
        { title: 'Detail Pesanan', href: '#' },
    ],
};
