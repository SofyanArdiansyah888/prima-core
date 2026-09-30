import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import {
    ShoppingCart,
    Plus,
    Search,
    MapPin,
    FileSpreadsheet,
    Eye,
    Building2,
    Calendar,
    ChevronRight,
    CheckCircle2,
    Clock,
    Filter,
    Copy,
    Check
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type OrderRow = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    customer_phone: string | null;
    customer_type: string;
    project_title: string;
    delivery_address: string;
    distance_km: number;
    delivery_fee: number;
    subtotal: number;
    total_price: number;
    payment_method: string | null;
    payment_status: string;
    status: string;
    created_at: string;
    items_count: number;
    work_orders_count: number;
    batching_plant?: { id: number; code: string; name: string };
    items?: { id: number; quantity: number; fulfilled_quantity: number; unit: string; product?: { name: string; code: string } }[];
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function OrderIndex({
    orders,
    plants,
    statuses,
    filters,
}: {
    orders: Paginated<OrderRow>;
    plants: { id: number; code: string; name: string }[];
    statuses: { value: string; label: string }[];
    filters: { search?: string; status?: string; batching_plant_id?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [plantId, setPlantId] = useState(filters.batching_plant_id ?? '');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sales/orders', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const copyToClipboard = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(`Kode ${code} disalin`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Calculate Quick Stats
    const stats = useMemo(() => {
        const total = orders.total ?? orders.data.length;
        const confirmed = orders.data.filter((o) => o.status === 'CONFIRMED').length;
        const inProd = orders.data.filter((o) => o.status === 'IN_PRODUCTION' || o.status === 'WORK_ORDER_CREATED').length;
        const completed = orders.data.filter((o) => o.status === 'COMPLETED').length;
        return { total, confirmed, inProd, completed };
    }, [orders]);

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'CONFIRMED':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'WORK_ORDER_CREATED':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'IN_PRODUCTION':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'PARTIAL_DELIVERY':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
            case 'COMPLETED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'CANCELLED':
                return 'bg-red-50 text-[#d91424] border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <Head title="Pesanan Pelanggan (Sales Orders)" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
                {/* Header Title & CTA */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Transaksi & Distribusi Tonasa
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Pesanan Pelanggan (Sales Orders)
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Kelola alokasi batching plant, pantau status pembayaran, dan terbitkan Surat Perintah Kerja (SPK).
                        </p>
                    </div>

                    <Button asChild className="h-10 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-4 font-bold text-white shadow-md shadow-[#0c1d37]/15 transition-all">
                        <Link href="/sales/orders/create">
                            <Plus className="size-4 mr-1.5" /> Buat Pesanan Baru
                        </Link>
                    </Button>
                </div>

                {/* KPI Statistics Ribbon */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Pesanan</span>
                        <span className="font-mono text-xl font-extrabold text-[#0c1d37] dark:text-white mt-0.5 block">{stats.total}</span>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">Dikonfirmasi</span>
                        <span className="font-mono text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">{stats.confirmed}</span>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">Dalam Produksi</span>
                        <span className="font-mono text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 block">{stats.inProd}</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Selesai Dikirim</span>
                        <span className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">{stats.completed}</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={submitSearch} className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[240px] max-w-sm flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9.5 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs font-medium placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0c1d37] focus-visible:ring-2 focus-visible:ring-[#0c1d37]/15 dark:border-slate-800 dark:bg-slate-800/60"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nomor SO, pelanggan, proyek..."
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/sales/orders', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Status</option>
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={plantId}
                            onChange={(e) => {
                                setPlantId(e.target.value);
                                router.get('/sales/orders', { search, status, batching_plant_id: e.target.value }, { preserveState: true });
                            }}
                            className="h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Plant</option>
                            {plants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9.5 rounded-xl px-4 text-xs font-bold">
                            Filter
                        </Button>
                    </form>

                    <div className="text-xs text-slate-400 font-medium">
                        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{orders.data.length}</span> dari {orders.total ?? orders.data.length} pesanan
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Kode & Waktu</th>
                                    <th className="px-4 py-3">Pelanggan & Target Proyek</th>
                                    <th className="px-4 py-3">Plant Alokasi</th>
                                    <th className="px-4 py-3">Total Nilai Tagihan</th>
                                    <th className="px-4 py-3 text-center">Status Pembayaran</th>
                                    <th className="px-4 py-3 text-center">Status Pemenuhan</th>
                                    <th className="px-4 py-3 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                    <ShoppingCart className="size-6" />
                                                </div>
                                                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Tidak Ada Pesanan Ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Belum ada pesanan yang sesuai dengan parameter filter.
                                                </p>
                                                <Button asChild size="sm" className="mt-4 rounded-xl bg-[#0c1d37] text-white">
                                                    <Link href="/sales/orders/create">Input Pesanan Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((o) => (
                                        <tr key={o.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            {/* 1. CODE & TIMESTAMP */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-black text-[#0c1d37] dark:text-slate-200">
                                                        {o.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => copyToClipboard(e, o.code)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                                                        title="Salin Kode"
                                                    >
                                                        {copiedCode === o.code ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                                    </button>
                                                </div>
                                                <span className="mt-0.5 text-[10px] text-slate-400 block font-mono">
                                                    {formatDateTime(o.created_at)}
                                                </span>
                                            </td>

                                            {/* 2. CUSTOMER & PROJECT */}
                                            <td className="px-4 py-3 align-top max-w-[280px]">
                                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                                    {o.customer_name}
                                                </p>
                                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                                    {o.project_title}
                                                </p>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                                                    <MapPin className="size-2.5 shrink-0 text-slate-400" />
                                                    <span className="truncate">{o.delivery_address}</span>
                                                </div>
                                            </td>

                                            {/* 3. PLANT & DISTANCE */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                                    {o.batching_plant?.name ?? '—'}
                                                </p>
                                                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                                                    Jarak: {Number(o.distance_km)} km
                                                </span>
                                            </td>

                                            {/* 4. TOTAL PRICE */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <span className="font-mono text-xs font-black text-[#0c1d37] dark:text-white">
                                                    Rp {Number(o.total_price).toLocaleString('id-ID')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                                    {o.items_count} item material
                                                </span>
                                            </td>

                                            {/* 5. PAYMENT STATUS */}
                                            <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                                                {o.payment_status === 'APPROVED_CREDIT' || o.payment_status === 'PAID' ? (
                                                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        {o.payment_status === 'PAID' ? 'LUNAS' : 'KREDIT OK'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        MENUNGGU
                                                    </span>
                                                )}
                                            </td>

                                            {/* 6. FULFILLMENT STATUS */}
                                            <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${getStatusBadge(o.status)}`}>
                                                    {o.status}
                                                </span>
                                                {o.work_orders_count > 0 && (
                                                    <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold block mt-0.5">
                                                        {o.work_orders_count} SPK Terbit
                                                    </span>
                                                )}
                                            </td>

                                            {/* 7. ACTIONS */}
                                            <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button asChild variant="outline" size="sm" className="h-7.5 rounded-lg px-2.5 text-xs font-bold border-slate-200 hover:bg-slate-100">
                                                        <Link href={`/sales/orders/${o.uuid}`}>
                                                            <Eye className="size-3.5 mr-1 text-slate-500" />
                                                            <span>Detail</span>
                                                        </Link>
                                                    </Button>
                                                    {o.status === 'CONFIRMED' && (
                                                        <Button asChild size="sm" className="h-7.5 rounded-lg bg-[#0c1d37] hover:bg-[#162e55] text-white px-2.5 text-xs font-bold shadow-xs">
                                                            <Link href={`/production/work-orders/create?order_id=${o.id}`}>
                                                                <FileSpreadsheet className="size-3.5 mr-1 text-amber-400" />
                                                                <span>SPK</span>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-medium">
                                Navigasi halaman
                            </span>
                            <div className="flex gap-1">
                                {orders.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={Boolean(link.url)}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className={`h-8 px-3 rounded-lg text-xs font-bold ${
                                            link.active
                                                ? 'bg-[#0c1d37] text-white hover:bg-[#162e55]'
                                                : 'border-slate-200 text-slate-700 dark:border-slate-800'
                                        }`}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

OrderIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pesanan Pelanggan', href: '/sales/orders' },
    ],
};

