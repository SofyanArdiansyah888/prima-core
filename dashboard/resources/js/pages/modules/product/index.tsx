import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, Plus, Search, Tag, CheckCircle2, XCircle, Truck, Layers, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type ProductRow = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    base_price: number;
    max_trip_capacity: number;
    allow_combined_delivery: boolean;
    min_order: number;
    slump: string | null;
    tag: string | null;
    is_active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function ProductIndex({
    products,
    categories,
    filters,
}: {
    products: Paginated<ProductRow>;
    categories: { value: string; label: string }[];
    filters: { search?: string; category?: string; is_active?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/master/products', { search, category }, { preserveState: true });
    };

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'readymix':
                return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
            case 'cement':
                return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'mortar':
                return 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <>
            <Head title="Master Produk & Material" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Katalog Mutu & Logistik PKM
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Master Produk & Ready Mix
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Kelola varian mutu beton Ready Mix, Semen Tonasa OPC/PCC, serta konfigurasi kapasitas ritase dan aturan pengiriman.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-[#0c1d37] font-medium text-white shadow-xs hover:bg-[#162e55] dark:bg-slate-800 dark:hover:bg-slate-700">
                        <Link href="/master/products/create">
                            <Plus className="size-4" /> Tambah Produk
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
                                placeholder="Cari kode (K-300), nama produk…"
                            />
                        </div>

                        <select
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                router.get('/master/products', { search, category: e.target.value }, { preserveState: true });
                            }}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-4 font-medium">
                            Filter
                        </Button>

                        {(filters.search || filters.category) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                onClick={() => {
                                    setSearch('');
                                    setCategory('');
                                    router.get('/master/products');
                                }}
                            >
                                Reset
                            </Button>
                        )}
                    </form>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{products.total ?? products.data.length}</span> item produk
                    </div>
                </div>

                {/* Product Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Kode & Nama Produk</th>
                                    <th className="px-5 py-3.5">Kategori</th>
                                    <th className="px-5 py-3.5">Harga Satuan</th>
                                    <th className="px-5 py-3.5">Kapasitas Armada</th>
                                    <th className="px-5 py-3.5">Karakteristik Pengiriman</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {products.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Package className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada produk ditemukan</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Belum ada produk yang didaftarkan.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/master/products/create">Tambah Produk Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {products.data.map((p) => (
                                    <tr key={p.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-start gap-2.5">
                                                <span className="inline-flex shrink-0 items-center rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {p.code}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                                                    {p.tag && (
                                                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            <Tag className="size-3" /> {p.tag}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${getCategoryBadge(p.category)}`}>
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                            Rp {Number(p.base_price).toLocaleString('id-ID')}
                                            <span className="ml-1 text-xs font-normal text-slate-500">/{p.unit}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                                <Truck className="size-3.5 text-slate-400" />
                                                <span>Max {Number(p.max_trip_capacity).toLocaleString('id-ID')} {p.unit}/rit</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.allow_combined_delivery ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                    <Layers className="size-3" />
                                                    Bisa Campur Customer (Multi-drop)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                                    <CheckCircle2 className="size-3" />
                                                    Eksklusif 1 Customer / Trip
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.is_active ? (
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
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40"
                                                    title="Edit Produk"
                                                >
                                                    <Link href={`/master/products/${p.uuid}/edit`}>
                                                        <Pencil className="size-3.5" />
                                                        <span className="sr-only">Edit</span>
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.links && products.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Halaman navigasi
                            </span>
                            <div className="flex gap-1">
                                {products.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={Boolean(link.url)}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className={`h-8 px-3 text-xs ${
                                            link.active
                                                ? 'bg-[#0c1d37] text-white hover:bg-[#162e55]'
                                                : 'border-slate-200 dark:border-slate-800'
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

ProductIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Master Produk', href: '/master/products' },
    ],
};
