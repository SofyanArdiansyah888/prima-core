import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Search, MapPin, FileSpreadsheet, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sales/orders', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'CONFIRMED':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'WORK_ORDER_CREATED':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'IN_PRODUCTION':
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'PARTIAL_DELIVERY':
                return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'CANCELLED':
                return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <Head title="Pesanan & Penjualan (Sales Orders)" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Transaksi & Penjualan Tonasa
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Pesanan Pelanggan (Sales Orders)
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Daftar pesanan beton Ready Mix dan semen dari mobile app & backoffice. Alokasi batching plant terdekat dan penerbitan SPK.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <Link href="/sales/orders/create">
                            <Plus className="size-4" /> Buat Pesanan Baru
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                        <div className="relative w-72">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode SO, nama customer, proyek…"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/sales/orders', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Plant Ditugaskan</option>
                            {plants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-4 font-medium">
                            Cari
                        </Button>
                    </form>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{orders.total ?? orders.data.length}</span> pesanan
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Nomor SO & Customer</th>
                                    <th className="px-5 py-3.5">Proyek & Lokasi Tujuan</th>
                                    <th className="px-5 py-3.5">Plant Terdekat</th>
                                    <th className="px-5 py-3.5">Total Tagihan</th>
                                    <th className="px-5 py-3.5">Status Pembayaran</th>
                                    <th className="px-5 py-3.5">Status Pemenuhan</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <ShoppingCart className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada pesanan ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Belum ada pesanan yang terdaftar.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/sales/orders/create">Input Pesanan Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {orders.data.map((o) => (
                                    <tr key={o.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {o.code}
                                                </span>
                                                <span className="text-[11px] text-slate-400 block mt-1">
                                                    {formatDateTime(o.created_at)}
                                                </span>
                                                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{o.customer_name}</p>
                                                <span className="text-[11px] text-slate-500 font-mono">{o.customer_phone || o.customer_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-slate-900 dark:text-white">{o.project_title}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                <MapPin className="size-3 shrink-0 text-slate-400" />
                                                <span>{o.delivery_address}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{o.batching_plant?.name ?? '—'}</p>
                                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                                    Jarak: {Number(o.distance_km)} Km (Ongkir Rp {Number(o.delivery_fee).toLocaleString('id-ID')})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                Rp {Number(o.total_price).toLocaleString('id-ID')}
                                            </span>
                                            <p className="text-[11px] text-slate-500">{o.items_count} item material</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {o.payment_status === 'APPROVED_CREDIT' || o.payment_status === 'PAID' ? (
                                                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                    {o.payment_status === 'PAID' ? 'LUNAS' : 'KREDIT APPROVED'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                    PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(o.status)}`}>
                                                {o.status}
                                            </span>
                                            {o.work_orders_count > 0 && (
                                                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
                                                    {o.work_orders_count} Work Order Terbit
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-medium">
                                                    <Link href={`/sales/orders/${o.uuid}`}>
                                                        <Eye className="size-3.5" /> Detail
                                                    </Link>
                                                </Button>
                                                {o.status === 'CONFIRMED' && (
                                                    <Button asChild size="sm" className="h-8 bg-purple-700 text-white hover:bg-purple-800 text-xs">
                                                        <Link href={`/production/work-orders/create?order_id=${o.id}`}>
                                                            <FileSpreadsheet className="size-3.5" /> Buat SPK
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Halaman navigasi
                            </span>
                            <div className="flex gap-1">
                                {orders.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={Boolean(link.url)}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className={`h-8 px-3 text-xs ${
                                            link.active
                                                ? 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600'
                                                : 'border-slate-200 dark:border-slate-800'
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
        { title: 'Pesanan & Penjualan', href: '/sales/orders' },
    ],
};
