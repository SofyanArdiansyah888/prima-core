import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDate } from '@/lib/utils';
import { FileSpreadsheet, Plus, Search, Calendar, Factory, Eye, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type WorkOrderRow = {
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
    };
    batching_plant: {
        id: number;
        code: string;
        name: string;
    };
    assigned_user?: {
        name: string;
        code: string;
    };
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function WorkOrderIndex({
    workOrders,
    plants,
    statuses,
    filters,
}: {
    workOrders: Paginated<WorkOrderRow>;
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
        router.get('/production/work-orders', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'SCHEDULED':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'IN_PRODUCTION':
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'READY_FOR_DISPATCH':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
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
            <Head title="Work Order / Surat Perintah Kerja (SPK)" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-300">
                                Produksi & Batching Plant PKM
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Work Orders (Surat Perintah Kerja)
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Jadwal produksi batching dan pencampuran formula beton berdasarkan pesanan pelanggan yang masuk.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-purple-700 font-medium text-white shadow-xs hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700">
                        <Link href="/production/work-orders/create">
                            <Plus className="size-4" /> Terbitkan SPK Baru
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                        <div className="relative w-72">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm focus-visible:ring-purple-500/20 focus-visible:border-purple-600 dark:border-slate-800"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode SPK, pelanggan, nomor SO…"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/production/work-orders', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Status Produksi</option>
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
                                router.get('/production/work-orders', { search, status, batching_plant_id: e.target.value }, { preserveState: true });
                            }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Batching Plant</option>
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
                        Total: <span className="font-bold text-slate-900 dark:text-white">{workOrders.total ?? workOrders.data.length}</span> work order
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Nomor SPK & Pesanan</th>
                                    <th className="px-5 py-3.5">Batching Plant</th>
                                    <th className="px-5 py-3.5">Produk Mutu & Formula</th>
                                    <th className="px-5 py-3.5">Jadwal Produksi</th>
                                    <th className="px-5 py-3.5 text-center">Progress (Target / Batch / Kirim)</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {workOrders.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <FileSpreadsheet className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Belum ada Work Order</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Terbitkan SPK dari pesanan customer yang masuk.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/production/work-orders/create">Terbitkan SPK</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {workOrders.data.map((wo) => {
                                    const percent = Math.min(100, Math.round((Number(wo.produced_quantity) / Number(wo.target_quantity)) * 100));

                                    return (
                                        <tr key={wo.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center rounded-md border border-purple-200/80 bg-purple-100/80 px-2 py-0.5 font-mono text-xs font-bold text-purple-900 dark:border-purple-700 dark:bg-purple-900/50 dark:text-purple-200">
                                                    {wo.code}
                                                </span>
                                                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{wo.order?.customer_name}</p>
                                                <span className="text-[11px] text-slate-500 font-mono">Ref SO: {wo.order?.code}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Factory className="size-3.5 text-slate-400" />
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{wo.batching_plant?.name}</span>
                                                </div>
                                                <span className="text-[11px] text-slate-500 font-mono">{wo.assigned_user?.name ? `Operator: ${wo.assigned_user.name}` : ''}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-900 dark:text-white">{wo.product?.name ?? 'Ready Mix Beton'}</p>
                                                {wo.batch_recipe_code && (
                                                    <span className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                        Recipe: {wo.batch_recipe_code}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    <span>{formatDate(wo.scheduled_date)}</span>
                                                </div>
                                                <span className="text-[11px] text-slate-500 font-medium">{wo.scheduled_time_slot || 'Reguler'}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {Number(wo.produced_quantity)} / {Number(wo.target_quantity)} {wo.unit}
                                                    </span>
                                                    <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-0.5">Terkirim: {Number(wo.dispatched_quantity)} {wo.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(wo.status)}`}>
                                                    {wo.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-medium">
                                                    <Link href={`/production/work-orders/${wo.uuid}`}>
                                                        <Eye className="size-3.5" /> Detail & Batching
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

WorkOrderIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Work Orders', href: '/production/work-orders' },
    ],
};
