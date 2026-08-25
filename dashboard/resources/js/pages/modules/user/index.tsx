import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
    branch?: { code: string; name: string };
    batching_plants: { id: number; code: string; name: string }[];
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

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
    const [role, setRole] = useState(filters.role ?? '');
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
        if (role) params.role = role;
        if (branchId) params.branch_id = branchId;
        router.get('/master/users', params, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setRole('');
        setBranchId('');
        router.get('/master/users');
    };

    return (
        <>
            <Head title="Master User" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Master Data · Personil
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Pengguna & Operator
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Kelola personil, hak akses, dan otorisasi batching plant. Format kode: <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">EMP-[REGION]-YYYY#####</span>
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <Link href="/master/users/create">
                            <Plus className="size-4" /> Tambah User
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, email, kode…"
                            />
                        </div>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>

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

                        {(filters.search || filters.role || filters.branch_id) && (
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
                        Total: <span className="font-bold text-slate-900 dark:text-white">{users.total ?? users.data.length}</span> personil
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Kode Karyawan</th>
                                    <th className="px-5 py-3.5">Nama & Email</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5">Cabang</th>
                                    <th className="px-5 py-3.5">Otorisasi Plant</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Users className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada user ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Filter tidak cocok atau belum ada pengguna yang terdaftar.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/master/users/create">Tambah User Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((u) => (
                                    <tr
                                        key={u.uuid}
                                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {u.code ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    u.role === 'admin'
                                                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                                        : 'border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                }`}
                                            >
                                                {u.role === 'admin' ? 'Administrator' : 'Operator Plant'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                                            {u.branch ? (
                                                <>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{u.branch.code}</span> — {u.branch.name}
                                                </>
                                            ) : (
                                                <span className="text-slate-400">Headquarter</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.batching_plants?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {u.batching_plants.map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        >
                                                            {p.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.is_active ? (
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
                                                <Link href={`/master/users/${u.uuid}/edit`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links && users.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Halaman navigasi
                            </span>
                            <div className="flex gap-1">
                                {users.links.map((link, idx) => (
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

UserIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: '/master/users' },
    ],
};
