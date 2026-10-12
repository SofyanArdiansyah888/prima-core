import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type CategoryRow = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    slug: string;
    default_unit: string;
    sort_order: number;
    show_in_catalog: boolean;
    is_active: boolean;
    products_count: number;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function ProductCategoryIndex({
    categories,
    filters,
}: {
    categories: Paginated<CategoryRow>;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/master/product-categories', { search }, { preserveState: true });
    };

    return (
        <>
            <Head title="Kategori Produk" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-[#ea580c]/20 bg-[#ea580c]/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Master Data · Katalog
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Kategori Produk
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Daftar kategori yang dipakai form produk, tarif kirim, dan katalog pelanggan.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-[#0c1d37] font-medium text-white shadow-xs hover:bg-[#162e55]">
                        <Link href="/master/product-categories/create">
                            <Plus className="size-4" /> Tambah Kategori
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <form onSubmit={submitSearch} className="flex w-full max-w-md items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="h-9 border-slate-200 pl-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode, nama, atau slug…"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-4 font-medium">
                            Cari
                        </Button>
                    </form>
                    <div className="text-xs text-slate-500">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{categories.total ?? categories.data.length}</span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/60">
                                <tr>
                                    <th className="px-5 py-3.5">Kode</th>
                                    <th className="px-5 py-3.5">Nama</th>
                                    <th className="px-5 py-3.5">Slug</th>
                                    <th className="px-5 py-3.5">Satuan</th>
                                    <th className="px-5 py-3.5 text-center">Produk</th>
                                    <th className="px-5 py-3.5">Katalog</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                                            <Tags className="mx-auto mb-2 size-5" />
                                            Belum ada kategori. Tambah kategori pertama untuk katalog.
                                        </td>
                                    </tr>
                                )}
                                {categories.data.map((row) => (
                                    <tr key={row.uuid} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                                        <td className="px-5 py-3 font-mono text-xs font-semibold">{row.code}</td>
                                        <td className="px-5 py-3 font-medium">{row.name}</td>
                                        <td className="px-5 py-3 font-mono text-xs">{row.slug}</td>
                                        <td className="px-5 py-3">{row.default_unit}</td>
                                        <td className="px-5 py-3 text-center">{row.products_count}</td>
                                        <td className="px-5 py-3">{row.show_in_catalog ? 'Tampil' : 'Sembunyi'}</td>
                                        <td className="px-5 py-3">{row.is_active ? 'Aktif' : 'Nonaktif'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Button asChild variant="outline" size="sm" className="h-8">
                                                <Link href={`/master/product-categories/${row.uuid}/edit`}>
                                                    <Pencil className="size-3.5" /> Edit
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

ProductCategoryIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Kategori Produk', href: '/master/product-categories' },
    ],
};
