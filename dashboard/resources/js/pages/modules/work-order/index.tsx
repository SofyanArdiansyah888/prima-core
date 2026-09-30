import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDate } from '@/lib/utils';
import {
    FileSpreadsheet,
    Plus,
    Search,
    Calendar,
    Factory,
    Eye,
    CheckCircle2,
    Copy,
    Check,
    FlaskConical,
    Clock,
    Layers,
    UserCheck,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
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
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/production/work-orders', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const copyToClipboard = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(`Kode SPK ${code} disalin`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Calculate Quick KPI Stats
    const stats = useMemo(() => {
        const total = workOrders.total ?? workOrders.data.length;
        const scheduled = workOrders.data.filter((w) => w.status === 'SCHEDULED').length;
        const inProd = workOrders.data.filter((w) => w.status === 'IN_PRODUCTION').length;
        const readyOrDone = workOrders.data.filter((w) => w.status === 'READY_FOR_DISPATCH' || w.status === 'COMPLETED').length;
        return { total, scheduled, inProd, readyOrDone };
    }, [workOrders]);

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'SCHEDULED':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'IN_PRODUCTION':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'READY_FOR_DISPATCH':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
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
            <Head title="Work Order / Surat Perintah Kerja (SPK)" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Produksi & Batching Plant PKM
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Surat Perintah Kerja (SPK / Work Orders)
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Jadwal pencampuran formula beton, monitoring real-time volume batching, dan persiapan pengiriman armada.
                        </p>
                    </div>
                    <Button asChild className="h-10 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-4 font-bold text-white shadow-md shadow-[#0c1d37]/15 transition-all">
                        <Link href="/production/work-orders/create">
                            <Plus className="size-4 mr-1.5" /> Terbitkan SPK Baru
                        </Link>
                    </Button>
                </div>

                {/* KPI Ribbon */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total SPK Aktif</span>
                        <span className="font-mono text-xl font-extrabold text-[#0c1d37] dark:text-white mt-0.5 block">{stats.total}</span>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">Terjadwal (Scheduled)</span>
                        <span className="font-mono text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">{stats.scheduled}</span>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">Sedang Batching</span>
                        <span className="font-mono text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 block">{stats.inProd}</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Siap Kirim / Selesai</span>
                        <span className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">{stats.readyOrDone}</span>
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
                                placeholder="Cari kode SPK, pelanggan, nomor SO..."
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/production/work-orders', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
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
                            className="h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Batching Plant</option>
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
                        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{workOrders.data.length}</span> dari {workOrders.total ?? workOrders.data.length} SPK
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Kode SPK & Ref SO</th>
                                    <th className="px-4 py-3">Batching Plant & Operator</th>
                                    <th className="px-4 py-3">Mutu Produk & Recipe</th>
                                    <th className="px-4 py-3">Jadwal Produksi</th>
                                    <th className="px-4 py-3 min-w-[180px]">Progress Batching</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {workOrders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                    <FileSpreadsheet className="size-6" />
                                                </div>
                                                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Belum Ada Work Order</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Terbitkan SPK dari pesanan customer yang sudah dikonfirmasi.
                                                </p>
                                                <Button asChild size="sm" className="mt-4 rounded-xl bg-[#0c1d37] text-white">
                                                    <Link href="/production/work-orders/create">Terbitkan SPK Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    workOrders.data.map((wo) => {
                                        const target = Number(wo.target_quantity) || 0;
                                        const produced = Number(wo.produced_quantity) || 0;
                                        const percent = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;

                                        return (
                                            <tr key={wo.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                                {/* 1. CODE & REF SO */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-black text-[#0c1d37] dark:text-slate-200">
                                                            {wo.code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => copyToClipboard(e, wo.code)}
                                                            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                                                            title="Salin Kode SPK"
                                                        >
                                                            {copiedCode === wo.code ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5 max-w-[200px]">
                                                        {wo.order?.customer_name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-mono block">
                                                        SO: {wo.order?.code}
                                                    </span>
                                                </td>

                                                {/* 2. PLANT & OPERATOR */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                                        <Factory className="size-3 text-[#ea580c] shrink-0" />
                                                        <span>{wo.batching_plant?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                                                        <UserCheck className="size-2.5 text-slate-400 shrink-0" />
                                                        <span>{wo.assigned_user?.name ? `Op: ${wo.assigned_user.name}` : 'Belum Ditugaskan'}</span>
                                                    </div>
                                                </td>

                                                {/* 3. PRODUCT & RECIPE */}
                                                <td className="px-4 py-3 align-top max-w-[240px]">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                                        {wo.product?.name ?? 'Ready Mix Beton'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        {wo.batch_recipe_code && (
                                                            <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                                                                <FlaskConical className="size-2.5" />
                                                                {wo.batch_recipe_code}
                                                            </span>
                                                        )}
                                                        {wo.slump_target && (
                                                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                                                Slump {wo.slump_target}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. SCHEDULE */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                                        <Calendar className="size-3 text-slate-400" />
                                                        <span>{formatDate(wo.scheduled_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                                        <Clock className="size-2.5 text-slate-400" />
                                                        <span>{wo.scheduled_time_slot || 'Slot Reguler'}</span>
                                                    </div>
                                                </td>

                                                {/* 5. PROGRESS BATCHING */}
                                                <td className="px-4 py-3 align-top min-w-[180px]">
                                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                            {produced} / {target} {wo.unit}
                                                        </span>
                                                        <span className="font-mono font-extrabold text-[#ea580c]">
                                                            {percent}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-[#ea580c]' : 'bg-slate-300 dark:bg-slate-700'
                                                            }`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                                                        Terkirim: {Number(wo.dispatched_quantity)} {wo.unit}
                                                    </span>
                                                </td>

                                                {/* 6. STATUS */}
                                                <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${getStatusBadge(wo.status)}`}>
                                                        {wo.status}
                                                    </span>
                                                </td>

                                                {/* 7. ACTIONS */}
                                                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                                    <Button asChild size="sm" className="h-7.5 rounded-lg bg-[#0c1d37] hover:bg-[#162e55] text-white px-2.5 text-xs font-bold shadow-xs">
                                                        <Link href={`/production/work-orders/${wo.uuid}`}>
                                                            <Eye className="size-3.5 mr-1 text-slate-300" />
                                                            <span>Detail & Batch</span>
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {workOrders.links && workOrders.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-medium">
                                Navigasi halaman
                            </span>
                            <div className="flex gap-1">
                                {workOrders.links.map((link, idx) => (
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

WorkOrderIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Work Orders', href: '/production/work-orders' },
    ],
};
