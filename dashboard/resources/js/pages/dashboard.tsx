import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Clock,
    Factory,
    FileSpreadsheet,
    Layers,
    Package,
    Play,
    Plus,
    Scale,
    ShoppingCart,
    Truck,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DeliveryMap } from '@/components/map/delivery-map';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import { dashboard } from '@/routes';

type Stats = {
    branches: number;
    plants: number;
    users: number;
    orders: number;
    workOrders: number;
    dispatches: number;
    products: number;
    ordersPending: number;
    ordersConfirmed: number;
    ordersInProduction: number;
    ordersCompleted: number;
    workOrdersScheduled: number;
    workOrdersInProd: number;
    workOrdersReadyDispatch: number;
    dispatchDeparted: number;
    dispatchOnTheWay: number;
    dispatchArrived: number;
    dispatchCompleted: number;
};

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lng: number;
    status: string;
    daily_capacity_m3: number | null;
};

type DeliveryItem = {
    id: number;
    surat_jalan_code?: string;
    surat_jalan_uuid?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string | null;
    status: string;
    dispatch_status?: string;
    delivery_sequence: number;
    customer_name: string;
    project_title: string | null;
    destination_address: string;
    lat: number;
    lng: number;
    product_name?: string;
    product_code?: string;
    quantity: number;
    unit: string;
    plant_name?: string;
    plant_lat?: number;
    plant_lng?: number;
};

type RecentOrder = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    customer_type: string;
    project_title: string;
    status: string;
    payment_status: string;
    total_price: string;
    created_at: string;
    batching_plant?: { name: string; code: string };
};

type RecentDispatch = {
    id: number;
    uuid: string;
    code: string;
    vehicle_number: string;
    driver_name: string;
    status: string;
    net_weight_kg: string | null;
    plant_name: string | null;
    created_at: string;
    customers: string[];
};

const ORDER_STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
    CONFIRMED: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
    IN_PRODUCTION: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300',
    WORK_ORDER_CREATED: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300',
    PARTIAL_DELIVERY: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
    COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    CANCELLED: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300',
    // payment
    PAID: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    APPROVED_CREDIT: 'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-300',
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
};

const DISPATCH_STATUS_COLOR: Record<string, string> = {
    DEPARTED: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
    ON_THE_WAY: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300',
    ARRIVED: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
    COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
};

const STATUS_LABEL: Record<string, string> = {
    // Order
    PENDING: 'Pending',
    CONFIRMED: 'Dikonfirmasi',
    IN_PRODUCTION: 'Produksi',
    WORK_ORDER_CREATED: 'SPK Dibuat',
    PARTIAL_DELIVERY: 'Sebagian Terkirim',
    COMPLETED: 'Selesai',
    CANCELLED: 'Batal',
    // Work Order
    SCHEDULED: 'Terjadwal',
    READY_FOR_DISPATCH: 'Siap Kirim',
    // Dispatch
    DEPARTED: 'Berangkat',
    ON_THE_WAY: 'Dalam Perjalanan',
    ARRIVED: 'Tiba',
    // Payment
    PAID: 'Lunas',
    APPROVED_CREDIT: 'Kredit OK',
    PENDING_PAYMENT: 'Belum Bayar',
};

export default function Dashboard({
    stats,
    plants,
    activeDeliveries,
    recentOrders,
    recentDispatches,
}: {
    stats: Stats;
    plants: Plant[];
    activeDeliveries: DeliveryItem[];
    recentOrders: RecentOrder[];
    recentDispatches: RecentDispatch[];
}) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const activeOrdersCount = stats.ordersPending + stats.ordersConfirmed + stats.ordersInProduction;
    const activeWOCount = stats.workOrdersScheduled + stats.workOrdersInProd + stats.workOrdersReadyDispatch;
    const activeDispatchCount = stats.dispatchDeparted + stats.dispatchOnTheWay + stats.dispatchArrived;

    return (
        <>
            <Head title="Dashboard Operasional" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Tonasa Ready-Mix Network
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">PT Prima Karya Manunggal</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Dashboard Operasional
                        </h1>
                        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                            Pantau pesanan, produksi batching, dan pengantaran material secara terpadu.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Button asChild size="sm" variant="outline" className="h-9">
                            <Link href="/sales/orders/create">
                                <Plus className="size-4" /> Buat SO
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 bg-purple-700 font-medium text-white shadow-xs hover:bg-purple-800 dark:bg-purple-600">
                            <Link href="/production/work-orders/create">
                                <Plus className="size-4" /> Terbitkan SPK
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600">
                            <Link href="/dispatch/surat-jalan/create">
                                <Plus className="size-4" /> Buat SJ
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Primary Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Sales Orders */}
                    <Link href="/sales/orders" className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-l-4 border-slate-200/80 border-l-emerald-600 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Sales Orders</p>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.orders}</span>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Total</span>
                                </div>
                            </div>
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                <ShoppingCart className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="size-3" /> Pending
                                </span>
                                <span className="font-bold">{stats.ordersPending}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <Play className="size-3" /> Produksi
                                </span>
                                <span className="font-bold">{stats.ordersInProduction}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" /> Selesai
                                </span>
                                <span className="font-bold">{stats.ordersCompleted}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Work Orders */}
                    <Link href="/production/work-orders" className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-l-4 border-slate-200/80 border-l-purple-600 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Work Orders (SPK)</p>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.workOrders}</span>
                                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">Total</span>
                                </div>
                            </div>
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 group-hover:bg-purple-50 group-hover:text-purple-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                <FileSpreadsheet className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-slate-500">
                                    <Clock className="size-3" /> Terjadwal
                                </span>
                                <span className="font-bold">{stats.workOrdersScheduled}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <Play className="size-3" /> Batching
                                </span>
                                <span className="font-bold">{stats.workOrdersInProd}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" /> Siap Kirim
                                </span>
                                <span className="font-bold">{stats.workOrdersReadyDispatch}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Surat Jalan */}
                    <Link href="/dispatch/surat-jalan" className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-l-4 border-slate-200/80 border-l-blue-600 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Surat Jalan</p>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.dispatches}</span>
                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">Total</span>
                                </div>
                            </div>
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                <Truck className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <Truck className="size-3" /> Berangkat
                                </span>
                                <span className="font-bold">{stats.dispatchDeparted}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <ArrowRight className="size-3" /> Dalam Perjalanan
                                </span>
                                <span className="font-bold">{stats.dispatchOnTheWay}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" /> Selesai
                                </span>
                                <span className="font-bold">{stats.dispatchCompleted}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Infrastructure */}
                    <div className="flex flex-col gap-3">
                        <Link href="/master/batching-plants" className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-teal-400/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                    <Factory className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Batching Plants</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.plants} <span className="text-xs font-medium text-slate-500">unit</span></p>
                                </div>
                            </div>
                            <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </Link>
                        <Link href="/master/products" className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-orange-400/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-300">
                                    <Package className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Produk Aktif</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.products} <span className="text-xs font-medium text-slate-500">SKU</span></p>
                                </div>
                            </div>
                            <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-orange-600 transition-colors" />
                        </Link>
                        <Link href="/master/users" className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pengguna Aktif</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.users} <span className="text-xs font-medium text-slate-500">operator</span></p>
                                </div>
                            </div>
                            <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </Link>
                    </div>
                </div>

                {/* Activity Banner — Active ops summary */}
                {(activeOrdersCount > 0 || activeWOCount > 0 || activeDispatchCount > 0) && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Operasi Aktif Saat Ini:</span>
                        {activeOrdersCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/10 border border-emerald-700/20 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                <ShoppingCart className="size-3" /> {activeOrdersCount} SO Berjalan
                            </span>
                        )}
                        {activeWOCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-700/10 border border-purple-700/20 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:text-purple-300">
                                <FileSpreadsheet className="size-3" /> {activeWOCount} SPK Aktif
                            </span>
                        )}
                        {activeDispatchCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-700/10 border border-blue-700/20 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                <Truck className="size-3" /> {activeDispatchCount} Armada di Lapangan
                            </span>
                        )}
                    </div>
                )}

                {/* Map */}
                <DeliveryMap plants={plants} deliveries={activeDeliveries} />

                {/* Recent Data: 2-column grid */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Recent Sales Orders */}
                    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="size-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Pesanan Terbaru</h2>
                            </div>
                            <Link href="/sales/orders" className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium dark:text-emerald-400">
                                Semua SO <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentOrders.length === 0 ? (
                                <div className="px-5 py-8 text-center text-xs text-slate-400">Belum ada pesanan.</div>
                            ) : recentOrders.map((o) => (
                                <Link
                                    key={o.uuid}
                                    href={`/sales/orders/${o.uuid}`}
                                    className="flex items-start justify-between px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{o.code}</span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_COLOR[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {STATUS_LABEL[o.status] ?? o.status}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_COLOR[o.payment_status] ?? 'bg-slate-100 text-slate-500'}`}>
                                                {STATUS_LABEL[o.payment_status] ?? o.payment_status}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{o.customer_name}</p>
                                        <p className="truncate text-[11px] text-slate-500">{o.project_title} · {o.batching_plant?.name ?? '—'}</p>
                                        <p className="text-[11px] text-slate-400">{formatDateTime(o.created_at)}</p>
                                    </div>
                                    <div className="ml-3 text-right shrink-0">
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            Rp {Number(o.total_price).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Dispatches */}
                    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Truck className="size-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Surat Jalan Terbaru</h2>
                            </div>
                            <Link href="/dispatch/surat-jalan" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400">
                                Semua SJ <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentDispatches.length === 0 ? (
                                <div className="px-5 py-8 text-center text-xs text-slate-400">Belum ada surat jalan.</div>
                            ) : recentDispatches.map((sj) => (
                                <Link
                                    key={sj.uuid}
                                    href={`/dispatch/surat-jalan/${sj.uuid}`}
                                    className="flex items-start justify-between px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{sj.code}</span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DISPATCH_STATUS_COLOR[sj.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {STATUS_LABEL[sj.status] ?? sj.status}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                                            <Truck className="size-3 text-slate-400" />
                                            <span className="font-semibold">{sj.vehicle_number}</span>
                                            <span className="text-slate-400">·</span>
                                            <span>{sj.driver_name}</span>
                                        </div>
                                        {sj.customers.length > 0 && (
                                            <p className="truncate text-[11px] text-slate-500">
                                                Tujuan: {sj.customers.slice(0, 2).join(' & ')}{sj.customers.length > 2 ? ` +${sj.customers.length - 2} lainnya` : ''}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-slate-400">{formatDateTime(sj.created_at)} · {sj.plant_name ?? '—'}</p>
                                    </div>
                                    <div className="ml-3 text-right shrink-0">
                                        {sj.net_weight_kg ? (
                                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                                                <Scale className="size-3 text-slate-400" />
                                                <span className="font-bold">{Number(sj.net_weight_kg).toLocaleString('id-ID')} Kg</span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">—</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid gap-3 sm:grid-cols-4">
                    <Link href="/master/delivery-rates" className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="size-4 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Logistik</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tarif Pengantaran</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Atur tarif ongkir per radius per plant.</p>
                    </Link>
                    <Link href="/master/branches" className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="size-4 text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Wilayah</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cabang & Personil</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{stats.branches} cabang · {stats.users} operator terdaftar.</p>
                    </Link>
                    <Link href="/master/batching-plants" className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Factory className="size-4 text-teal-600" />
                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Produksi</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Batching Plant</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{stats.plants} plant aktif siap operasi.</p>
                    </Link>
                    <Link href="/master/products" className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="size-4 text-orange-600" />
                            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Master Data</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Katalog Produk</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{stats.products} produk ready mix & semen aktif.</p>
                    </Link>
                </div>

            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
