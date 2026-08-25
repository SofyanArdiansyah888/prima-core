import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import { Truck, Plus, Search, MapPin, Eye, Printer, Layers, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/dispatch/surat-jalan', { search, status, batching_plant_id: plantId }, { preserveState: true });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'PREPARED':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'DEPARTED':
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'ON_THE_WAY':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'ARRIVED':
                return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case 'UNLOADING':
                return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'RETURNED':
                return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <Head title="Surat Jalan & Logistik Pengantaran" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Dispataching & Delivery Tonasa
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Surat Jalan & Pengantaran Armada
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Penerbitan Surat Jalan pengangkutan (Single Trip, Partial Delivery, maupun Multi-Drop Gabungan) lengkap dengan nota timbangan.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <Link href="/dispatch/surat-jalan/create">
                            <Plus className="size-4" /> Terbitkan Surat Jalan Baru
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
                                placeholder="Cari nomor SJ, nopol truk, driver, pelanggan…"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/dispatch/surat-jalan', { search, status: e.target.value, batching_plant_id: plantId }, { preserveState: true });
                            }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                        Total: <span className="font-bold text-slate-900 dark:text-white">{suratJalans.total ?? suratJalans.data.length}</span> surat jalan
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Nomor SJ & Plant</th>
                                    <th className="px-5 py-3.5">Armada & Driver</th>
                                    <th className="px-5 py-3.5">Muatan & Tujuan Pengantaran</th>
                                    <th className="px-5 py-3.5">Timbangan Netto</th>
                                    <th className="px-5 py-3.5">Tipe Ritase</th>
                                    <th className="px-5 py-3.5">Status Pengantaran</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {suratJalans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Truck className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Belum ada Surat Jalan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Terbitkan Surat Jalan untuk memulai pengiriman armada.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/dispatch/surat-jalan/create">Terbitkan Surat Jalan Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {suratJalans.data.map((sj) => {
                                    const isMultiCustomer = (sj.items?.length ?? 0) > 1;

                                    return (
                                        <tr key={sj.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {sj.code}
                                                </span>
                                                {sj.created_at && (
                                                    <span className="text-[11px] text-slate-400 block mt-1">
                                                        {formatDateTime(sj.created_at)}
                                                    </span>
                                                )}
                                                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">{sj.batching_plant?.name}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Truck className="size-3.5 text-slate-400" />
                                                    <span className="font-semibold text-slate-900 dark:text-white">{sj.vehicle_number}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{sj.driver_name} {sj.driver_phone ? `(${sj.driver_phone})` : ''}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-1">
                                                    {sj.items?.map((it, idx) => (
                                                        <div key={idx} className="text-xs">
                                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                                {Number(it.quantity_delivered)} {it.unit} {it.product?.name}
                                                            </span>
                                                            <p className="text-[11px] text-slate-500">
                                                                Tujuan: {it.destination_customer_name} ({it.destination_project_title || 'Proyek'})
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {sj.net_weight_kg ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Scale className="size-3.5 text-slate-400" />
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                                                                {Number(sj.net_weight_kg).toLocaleString('id-ID')} Kg Netto
                                                            </p>
                                                            {sj.nota_timbangan_number && (
                                                                <span className="font-mono text-[10px] text-slate-400">{sj.nota_timbangan_number}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {isMultiCustomer ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                                        <Layers className="size-3" />
                                                        Multi-Drop ({sj.items?.length} Customer)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        Single Destination
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(sj.status)}`}>
                                                    {sj.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-medium">
                                                        <Link href={`/dispatch/surat-jalan/${sj.uuid}`}>
                                                            <Eye className="size-3.5" /> Detail
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="sm" className="h-8 px-2.5 bg-slate-800 text-white hover:bg-slate-900 text-xs">
                                                        <Link href={`/dispatch/surat-jalan/${sj.uuid}/print`} target="_blank">
                                                            <Printer className="size-3.5" /> Cetak SJ
                                                        </Link>
                                                    </Button>
                                                </div>
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

DispatchIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Surat Jalan & Pengantaran', href: '/dispatch/surat-jalan' },
    ],
};
