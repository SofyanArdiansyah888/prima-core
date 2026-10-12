import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';

type Category = {
    uuid: string;
    code: string;
    name: string;
    slug: string;
    default_unit: string;
    default_max_trip_capacity: number;
    default_allow_combined_delivery: boolean;
    sort_order: number;
    show_in_catalog: boolean;
    is_active: boolean;
};

export default function ProductCategoryForm({ category }: { category: Category | null }) {
    const editing = Boolean(category);
    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        default_unit: category?.default_unit ?? 'Sak',
        default_max_trip_capacity: category?.default_max_trip_capacity ?? 250,
        default_allow_combined_delivery: category?.default_allow_combined_delivery ?? true,
        sort_order: category?.sort_order ?? 0,
        show_in_catalog: category?.show_in_catalog ?? true,
        is_active: category?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing && category) {
            put(`/master/product-categories/${category.uuid}`);
            return;
        }
        post('/master/product-categories');
    };

    const deactivate = () => {
        if (!category) return;
        if (!window.confirm('Nonaktifkan kategori ini?')) return;
        router.delete(`/master/product-categories/${category.uuid}`);
    };

    return (
        <>
            <Head title={editing ? 'Edit Kategori Produk' : 'Tambah Kategori Produk'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href="/master/product-categories">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {editing ? 'Edit Kategori Produk' : 'Tambah Kategori Produk'}
                        </h1>
                        <p className="text-xs text-slate-500">
                            {editing ? `Kode ${category?.code} tetap. Slug tidak diubah karena dipakai produk.` : 'Kode dibuat otomatis. Slug kosong akan diambil dari nama.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <Tags className="size-5 text-emerald-600" />
                            <h2 className="text-base font-semibold">Data kategori</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="name">Nama *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1.5" />
                                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    disabled={editing}
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value.toLowerCase())}
                                    placeholder="contoh: readymix"
                                    className="mt-1.5 font-mono"
                                />
                                {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug}</p>}
                            </div>
                            <div>
                                <Label htmlFor="default_unit">Satuan default *</Label>
                                <Input id="default_unit" value={data.default_unit} onChange={(e) => setData('default_unit', e.target.value)} className="mt-1.5" />
                                {errors.default_unit && <p className="mt-1 text-xs text-rose-600">{errors.default_unit}</p>}
                            </div>
                            <div>
                                <Label htmlFor="default_max_trip_capacity">Kapasitas ritase default *</Label>
                                <Input
                                    id="default_max_trip_capacity"
                                    type="number"
                                    step="0.1"
                                    value={data.default_max_trip_capacity}
                                    onChange={(e) => setData('default_max_trip_capacity', Number(e.target.value))}
                                    className="mt-1.5"
                                />
                                {errors.default_max_trip_capacity && <p className="mt-1 text-xs text-rose-600">{errors.default_max_trip_capacity}</p>}
                            </div>
                            <div>
                                <Label htmlFor="sort_order">Urutan</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', Number(e.target.value))}
                                    className="mt-1.5"
                                />
                                {errors.sort_order && <p className="mt-1 text-xs text-rose-600">{errors.sort_order}</p>}
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.default_allow_combined_delivery}
                                    onChange={(e) => setData('default_allow_combined_delivery', e.target.checked)}
                                />
                                Boleh gabung muatan
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.show_in_catalog}
                                    onChange={(e) => setData('show_in_catalog', e.target.checked)}
                                />
                                Tampil di katalog pelanggan
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                Aktif
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        {editing ? (
                            <Button type="button" variant="outline" onClick={deactivate} disabled={processing}>
                                Nonaktifkan
                            </Button>
                        ) : (
                            <span />
                        )}
                        <Button type="submit" disabled={processing} className="bg-[#0c1d37] text-white hover:bg-[#162e55]">
                            Simpan
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductCategoryForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Kategori Produk', href: '/master/product-categories' },
        { title: 'Form', href: '#' },
    ],
};
