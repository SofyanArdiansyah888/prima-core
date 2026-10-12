import { Head, Link, router, usePage } from '@inertiajs/react';
import { Image, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type BannerRow = {
    uuid: string;
    code: string;
    badge: string;
    title: string;
    sort_order: number;
    is_active: boolean;
    image_url: string;
    category: { name: string } | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function BannerIndex({
    banners,
    filters,
}: {
    banners: Paginated<BannerRow>;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <>
            <Head title="Banner Beranda" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <span className="inline-flex items-center rounded-md border border-[#ea580c]/20 bg-[#ea580c]/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                            Master Data · Beranda
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">Banner Beranda</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Isi slider di beranda aplikasi pelanggan.</p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-[#0c1d37] text-white hover:bg-[#162e55]">
                        <Link href="/master/banners/create">
                            <Plus className="size-4" /> Tambah Banner
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/master/banners', { search }, { preserveState: true });
                    }}
                    className="flex max-w-md items-center gap-2"
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                        <Input className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul atau kode…" />
                    </div>
                    <Button type="submit" variant="secondary" size="sm" className="h-9">Cari</Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-5 py-3.5">Gambar</th>
                                <th className="px-5 py-3.5">Kode</th>
                                <th className="px-5 py-3.5">Judul</th>
                                <th className="px-5 py-3.5">Kategori</th>
                                <th className="px-5 py-3.5">Urutan</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                        <Image className="mx-auto mb-2 size-5" />
                                        Belum ada banner. Slider beranda disembunyikan sampai ada yang aktif.
                                    </td>
                                </tr>
                            )}
                            {banners.data.map((row) => (
                                <tr key={row.uuid} className="border-b last:border-0">
                                    <td className="px-5 py-3">
                                        <img src={row.image_url} alt="" className="h-12 w-16 rounded object-cover" />
                                    </td>
                                    <td className="px-5 py-3 font-mono text-xs">{row.code}</td>
                                    <td className="px-5 py-3">
                                        <div className="font-medium">{row.title}</div>
                                        <div className="text-xs text-slate-500">{row.badge}</div>
                                    </td>
                                    <td className="px-5 py-3">{row.category?.name ?? '—'}</td>
                                    <td className="px-5 py-3">{row.sort_order}</td>
                                    <td className="px-5 py-3">{row.is_active ? 'Aktif' : 'Nonaktif'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Button asChild variant="outline" size="sm" className="h-8">
                                            <Link href={`/master/banners/${row.uuid}/edit`}>
                                                <Pencil className="size-3.5" /> Edit
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="px-5 py-3 text-xs text-slate-500">Total {banners.total ?? banners.data.length} banner</p>
                </div>
            </div>
        </>
    );
}

BannerIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Banner Beranda', href: '/master/banners' },
    ],
};
