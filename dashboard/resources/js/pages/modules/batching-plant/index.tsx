import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[] };

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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <>
            <Head title="Master Batching Plant" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master Data</p>
                        <h1 className="font-serif text-3xl">Batching Plant</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400">Kode hierarkis: BR-…-BP-NN</p>
                    </div>
                    <Button asChild>
                        <Link href="/master/batching-plants/create">
                            <Plus className="size-4" /> Tambah plant
                        </Link>
                    </Button>
                </div>

                <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        router.get('/master/batching-plants', Object.fromEntries(fd.entries()), { preserveState: true });
                    }}
                >
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-stone-400" />
                        <Input className="pl-9" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari…" />
                    </div>
                    <select name="branch_id" defaultValue={filters.branch_id ?? ''} className="rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700">
                        <option value="">Semua cabang</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                        ))}
                    </select>
                    <Button type="submit" variant="secondary">Filter</Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 text-left dark:bg-stone-900/50">
                            <tr>
                                <th className="px-4 py-3">Kode</th>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Cabang</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {plants.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">Belum ada plant.</td></tr>
                            )}
                            {plants.data.map((p) => (
                                <tr key={p.uuid} className="border-t border-stone-100 dark:border-stone-800">
                                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                                    <td className="px-4 py-3">{p.name}</td>
                                    <td className="px-4 py-3">{p.branch?.code}</td>
                                    <td className="px-4 py-3"><Badge variant="secondary">{p.status}</Badge></td>
                                    <td className="px-4 py-3">{p.users_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/master/batching-plants/${p.uuid}/edit`}>Edit</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
