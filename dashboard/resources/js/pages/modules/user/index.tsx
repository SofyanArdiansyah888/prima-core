import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type UserRow = {
    id: number;
    uuid: string;
    code: string | null;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    branch?: { code: string; name: string } | null;
    batching_plants?: { code: string }[];
};

type Paginated<T> = { data: T[] };

export default function UserIndex({
    users,
    branches,
    roles,
    filters,
}: {
    users: Paginated<UserRow>;
    branches: { id: number; code: string; name: string }[];
    roles: { value: string; label: string }[];
    filters: { search?: string; role?: string; branch_id?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <>
            <Head title="Master User" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master Data</p>
                        <h1 className="font-serif text-3xl">User</h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400">Kode: EMP-REGION-YYYY##### · terikat cabang & plant</p>
                    </div>
                    <Button asChild>
                        <Link href="/master/users/create">
                            <Plus className="size-4" /> Tambah user
                        </Link>
                    </Button>
                </div>

                <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        router.get('/master/users', Object.fromEntries(fd.entries()), { preserveState: true });
                    }}
                >
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-stone-400" />
                        <Input className="pl-9" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, kode…" />
                    </div>
                    <select name="role" defaultValue={filters.role ?? ''} className="rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700">
                        <option value="">Semua role</option>
                        {roles.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    <select name="branch_id" defaultValue={filters.branch_id ?? ''} className="rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700">
                        <option value="">Semua cabang</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.code}</option>
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
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Cabang</th>
                                <th className="px-4 py-3">Plant</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-500">Belum ada user.</td></tr>
                            )}
                            {users.data.map((u) => (
                                <tr key={u.uuid} className="border-t border-stone-100 dark:border-stone-800">
                                    <td className="px-4 py-3 font-mono text-xs">{u.code}</td>
                                    <td className="px-4 py-3">
                                        <div>{u.name}</div>
                                        <div className="text-xs text-stone-500">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-3"><Badge variant="secondary">{u.role}</Badge></td>
                                    <td className="px-4 py-3">{u.branch?.code ?? 'HQ'}</td>
                                    <td className="px-4 py-3 text-xs">{u.batching_plants?.map((p) => p.code).join(', ') || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={u.is_active ? 'default' : 'secondary'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/master/users/${u.uuid}/edit`}>Edit</Link>
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

UserIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: '/master/users' },
    ],
};
