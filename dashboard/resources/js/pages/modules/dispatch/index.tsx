import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import {
    Truck,
    Plus,
    Search,
    MapPin,
    Eye,
    Printer,
    Layers,
    Scale,
    Copy,
    Check,
    Phone,
    Navigation,
    Clock,
    Factory,
    PackageCheck
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type SuratJalanRow = {
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
    net_weight_kg: number | null;
    nota_timbangan_number: string | null;
    created_at?: string;
    items_count: number;
    batching_plant?: { id: number; code: string; name: string };
    items?: {
        id: number;
        quantity_delivered: number;
        unit: string;
        destination_customer_name: string;
        destination_project_title: string | null;
        product?: { name: string; code: string };
        order?: { code: string };
    }[];
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function DispatchIndex({
    suratJalans,
    plants,
    statuses,
    filters,
}: {
    suratJalans: Paginated<SuratJalanRow>;
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
        router.get('/dispatch/surat-jalan', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const copyToClipboard = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(`Nomor Surat Jalan ${code} disalin`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Calculate Quick KPI Stats
    const stats = useMemo(() => {
        const total = suratJalans.total ?? suratJalans.data.length;
        const prepared = suratJalans.data.filter((s) => s.status === 'PREPARED' || s.status === 'DEPARTED').length;
        const inTransit = suratJalans.data.filter(
            (s) => s.status === 'ON_THE_WAY' || s.status === 'ARRIVED' || s.status === 'UNLOADING'
        ).length;
        const completed = suratJalans.data.filter((s) => s.status === 'COMPLETED' || s.status === 'RETURNED').length;
        return { total, prepared, inTransit, completed };
    }, [suratJalans]);

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'PREPARED':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'DEPARTED':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'ON_THE_WAY':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'ARRIVED':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
            case 'UNLOADING':
                return 'bg-orange-50 text-[#ea580c] border-[#ea580c]/30 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case 'COMPLETED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'RETURNED':
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <Head title="Surat Jalan & Logistik Pengantaran" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Logistik & Dispatching Tonasa
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Surat Jalan & Pengantaran Armada
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Penerbitan Surat Jalan (Single Trip / Multi-Drop), nota timbangan digital, dan monitoring GPS armada mixer.
                        </p>
                    </div>
                    <Button asChild className="h-10 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-4 font-bold text-white shadow-md shadow-[#0c1d37]/15 transition-all">
                        <Link href="/dispatch/surat-jalan/create">
                            <Plus className="size-4 mr-1.5" /> Terbitkan Surat Jalan
                        </Link>
                    </Button>
                </div>

                {/* KPI Ribbon */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Surat Jalan</span>
                        <span className="font-mono text-xl font-extrabold text-[#0c1d37] dark:text-white mt-0.5 block">{stats.total}</span>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">Persiapan / Muat</span>
                        <span className="font-mono text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">{stats.prepared}</span>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 shadow-2xs dark:border-purple-900/40 dark:bg-purple-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 block">Dalam Perjalanan / Tuang</span>
                        <span className="font-mono text-xl font-extrabold text-purple-700 dark:text-purple-400 mt-0.5 block">{stats.inTransit}</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Terkirim / Selesai</span>
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
                                placeholder="Cari nomor SJ, nopol truk, driver, customer..."
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/dispatch/surat-jalan', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Status Pengantaran</option>
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
                                router.get('/dispatch/surat-jalan', { search, status, batching_plant_id: e.target.value }, { preserveState: true });
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
                        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{suratJalans.data.length}</span> dari {suratJalans.total ?? suratJalans.data.length} surat jalan
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">No. Surat Jalan & Waktu</th>
                                    <th className="px-4 py-3">Armada & Driver</th>
                                    <th className="px-4 py-3">Plant & Tujuan Drop</th>
                                    <th className="px-4 py-3">Muatan & Volume</th>
                                    <th className="px-4 py-3">Timbangan Netto</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {suratJalans.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                    <Truck className="size-6" />
                                                </div>
                                                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Belum Ada Surat Jalan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Terbitkan Surat Jalan untuk memulai pengiriman armada logistik.
                                                </p>
                                                <Button asChild size="sm" className="mt-4 rounded-xl bg-[#0c1d37] text-white">
                                                    <Link href="/dispatch/surat-jalan/create">Terbitkan Surat Jalan</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    suratJalans.data.map((sj) => {
                                        const isMultiDrop = (sj.items?.length ?? 0) > 1;
                                        const firstItem = sj.items?.[0];
                                        const totalDelivered = sj.items?.reduce((sum, item) => sum + Number(item.quantity_delivered || 0), 0) ?? 0;
                                        const primaryUnit = firstItem?.unit ?? 'm³';

                                        return (
                                            <tr key={sj.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                                {/* 1. CODE & TIMESTAMP */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-black text-[#0c1d37] dark:text-slate-200">
                                                            {sj.code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => copyToClipboard(e, sj.code)}
                                                            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                                                            title="Salin No. SJ"
                                                        >
                                                            {copiedCode === sj.code ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                        {sj.departure_time ? `Berangkat: ${formatDateTime(sj.departure_time)}` : sj.created_at ? formatDateTime(sj.created_at) : '—'}
                                                    </span>
                                                </td>

                                                {/* 2. FLEET & DRIVER */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                                        <Truck className="size-3 text-[#ea580c] shrink-0" />
                                                        <span className="font-mono">{sj.vehicle_number}</span>
                                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded uppercase">
                                                            {sj.vehicle_type || 'Mixer'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                                                        <span>{sj.driver_name}</span>
                                                        {sj.driver_phone && (
                                                            <span className="text-[10px] text-slate-400 font-mono">({sj.driver_phone})</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 3. PLANT & DESTINATION */}
                                                <td className="px-4 py-3 align-top max-w-[260px]">
                                                    <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                                        <Factory className="size-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{sj.batching_plant?.name}</span>
                                                    </div>
                                                    <div className="mt-0.5">
                                                        {isMultiDrop ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                                    <Layers className="size-2.5" />
                                                                    Multi-Drop ({sj.items?.length} Customer)
                                                                </span>
                                                            </div>
                                                        ) : firstItem ? (
                                                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                                                {firstItem.destination_customer_name}
                                                                {firstItem.destination_project_title && ` • ${firstItem.destination_project_title}`}
                                                            </p>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. LOAD & VOLUME */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <span className="font-mono text-xs font-black text-[#0c1d37] dark:text-white">
                                                        {totalDelivered} {primaryUnit}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5">
                                                        {firstItem?.product?.name ?? 'Ready Mix Beton'}
                                                    </p>
                                                </td>

                                                {/* 5. WEIGHING SCALE */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    {sj.net_weight_kg ? (
                                                        <div>
                                                            <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                                <Scale className="size-3 text-slate-400" />
                                                                <span>{Number(sj.net_weight_kg).toLocaleString('id-ID')} Kg Netto</span>
                                                            </div>
                                                            {sj.nota_timbangan_number && (
                                                                <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                                                    Tiket: {sj.nota_timbangan_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 font-mono">Timbangan Manual</span>
                                                    )}
                                                </td>

                                                {/* 6. STATUS */}
                                                <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${getStatusBadge(sj.status)}`}>
                                                        {sj.status}
                                                    </span>
                                                </td>

                                                {/* 7. ACTIONS */}
                                                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button asChild variant="outline" size="sm" className="h-7.5 rounded-lg px-2 text-xs font-bold border-slate-200 hover:bg-slate-100">
                                                            <Link href={`/dispatch/surat-jalan/${sj.uuid}`}>
                                                                <Eye className="size-3 mr-1 text-slate-500" />
                                                                <span>Detail</span>
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" className="h-7.5 rounded-lg bg-[#0c1d37] hover:bg-[#162e55] text-white px-2 text-xs font-bold shadow-xs">
                                                            <Link href={`/dispatch/surat-jalan/${sj.uuid}/print`} target="_blank">
                                                                <Printer className="size-3 mr-1 text-amber-400" />
                                                                <span>Cetak SJ</span>
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {suratJalans.links && suratJalans.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-medium">
                                Navigasi halaman
                            </span>
                            <div className="flex gap-1">
                                {suratJalans.links.map((link, idx) => (
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

DispatchIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Surat Jalan & Pengantaran', href: '/dispatch/surat-jalan' },
    ],
};
