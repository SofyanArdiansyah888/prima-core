import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type BranchRow = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    phone: string | null;
    is_active: boolean;
    batching_plants_count: number;
    users_count: number;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function BranchIndex({
    branches,
    filters,
}: {
    branches: Paginated<BranchRow>;
    filters: { search?: string; is_active?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/master/branches', { search }, { preserveState: true });
    };

    return (
        <>
            <Head title="Master Cabang" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Master Data · Wilayah
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Cabang Operasional
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Kelola kantor cabang dan wilayah kerja ready-mix. Format kode: <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">BR-REGION-NN</span>
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <Link href="/master/branches/create">
                            <Plus className="size-4" /> Tambah Cabang
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={submitSearch} className="flex w-full max-w-md items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode cabang atau nama wilayah…"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-4 font-medium">
                            Cari
                        </Button>
                        {filters.search && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                onClick={() => {
                                    setSearch('');
                                    router.get('/master/branches');
                                }}
                            >
                                Reset
                            </Button>
                        )}
                    </form>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{branches.total ?? branches.data.length}</span> cabang terdaftar
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Kode</th>
                                    <th className="px-5 py-3.5">Nama Cabang</th>
                                    <th className="px-5 py-3.5">Telepon</th>
                                    <th className="px-5 py-3.5 text-center">Batching Plant</th>
                                    <th className="px-5 py-3.5 text-center">User</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {branches.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Building2 className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada cabang ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Belum ada data cabang atau filter pencarian tidak cocok.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/master/branches/create">Tambah Cabang Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {branches.data.map((b) => (
                                    <tr
                                        key={b.uuid}
                                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {b.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                            {b.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            {b.phone || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {b.batching_plants_count} plant
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {b.users_count} user
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {b.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                    <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                                    <span className="size-1.5 rounded-full bg-slate-400" />
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <Link href={`/master/branches/${b.uuid}/edit`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {branches.links && branches.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Halaman navigasi
                            </span>
                            <div className="flex gap-1">
                                {branches.links.map((link, idx) => (
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

BranchIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Cabang', href: '/master/branches' },
    ],
};


