import { Head, Link, router, usePage } from '@inertiajs/react';
import { Factory, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type PlantRow = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    status: string;
    is_active: boolean;
    users_count: number;
    branch?: { code: string; name: string };
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function PlantIndex({
    plants,
    branches,
    filters,
}: {
    plants: Paginated<PlantRow>;
    branches: { id: number; code: string; name: string }[];
    filters: { search?: string; branch_id?: string; status?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (branchId) params.branch_id = branchId;
        router.get('/master/batching-plants', params, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setBranchId('');
        router.get('/master/batching-plants');
    };

    const renderStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <span className="size-1.5 rounded-full bg-slate-400" />
                    Nonaktif
                </span>
            );
        }

        switch (status) {
            case 'OPERATIONAL':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        Operasional
                    </span>
                );
            case 'MAINTENANCE':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Maintenance
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        {status}
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Master Batching Plant" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Master Data · Unit Produksi
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Batching Plant
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Unit produksi beton ready-mix terdaftar. Format kode hierarkis: <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">[BR_CODE]-BP-NN</span>
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <Link href="/master/batching-plants/create">
                            <Plus className="size-4" /> Tambah Plant
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau kode plant…"
                            />
                        </div>

                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Cabang</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.code} — {b.name}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-4 font-medium">
                            Filter
                        </Button>

                        {(filters.search || filters.branch_id) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        )}
                    </form>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{plants.total ?? plants.data.length}</span> unit plant
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Kode Plant</th>
                                    <th className="px-5 py-3.5">Nama Batching Plant</th>
                                    <th className="px-5 py-3.5">Cabang Induk</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-center">Operator</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {plants.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Factory className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada plant ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Belum ada data batching plant atau filter yang dipilih kosong.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/master/batching-plants/create">Tambah Plant Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {plants.data.map((p) => (
                                    <tr
                                        key={p.uuid}
                                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {p.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                            {p.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">{p.branch?.code}</span> — {p.branch?.name}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {renderStatusBadge(p.status, p.is_active)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {p.users_count} operator
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <Link href={`/master/batching-plants/${p.uuid}/edit`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {plants.links && plants.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Halaman navigasi
                            </span>
                            <div className="flex gap-1">
                                {plants.links.map((link, idx) => (
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
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
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

PlantIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Batching Plants', href: '/master/batching-plants' },
    ],
};


