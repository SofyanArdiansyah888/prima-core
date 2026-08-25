import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master Data</p>
                        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">Cabang</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400">Kelola cabang operasional. Kode: BR-REGION-NN</p>
                    </div>
                    <Button asChild>
                        <Link href="/master/branches/create">
                            <Plus className="size-4" /> Tambah cabang
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitSearch} className="flex gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-stone-400" />
                        <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau nama…" />
                    </div>
                    <Button type="submit" variant="secondary">Cari</Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 text-left dark:bg-stone-900/50">
                            <tr>
                                <th className="px-4 py-3 font-medium">Kode</th>
                                <th className="px-4 py-3 font-medium">Nama</th>
                                <th className="px-4 py-3 font-medium">Plant</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {branches.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-stone-500">Belum ada cabang.</td>
                                </tr>
                            )}
                            {branches.data.map((b) => (
                                <tr key={b.uuid} className="border-t border-stone-100 dark:border-stone-800">
                                    <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                                    <td className="px-4 py-3">{b.name}</td>
                                    <td className="px-4 py-3">{b.batching_plants_count}</td>
                                    <td className="px-4 py-3">{b.users_count}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={b.is_active ? 'default' : 'secondary'}>
                                            {b.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/master/branches/${b.uuid}/edit`}>Edit</Link>
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

BranchIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Cabang', href: '/master/branches' },
    ],
};
