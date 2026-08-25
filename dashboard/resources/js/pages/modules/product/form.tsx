import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type Product = {
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
    recommended_for: string | null;
    description: string | null;
    tag: string | null;
    is_active: boolean;
};

export default function ProductForm({
    product,
    categories,
}: {
    product: Product | null;
    categories: { value: string; label: string }[];
}) {
    const isEdit = Boolean(product);

    const { data, setData, post, put, processing, errors } = useForm({
        code: product?.code ?? '',
        name: product?.name ?? '',
        category: product?.category ?? 'readymix',
        unit: product?.unit ?? 'm³',
        base_price: product?.base_price ?? '',
        max_trip_capacity: product?.max_trip_capacity ?? '',
        allow_combined_delivery: product?.allow_combined_delivery ?? false,
        min_order: product?.min_order ?? '',
        slump: product?.slump ?? '',
        recommended_for: product?.recommended_for ?? '',
        description: product?.description ?? '',
        tag: product?.tag ?? '',
        is_active: product?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/master/products/${product!.uuid}`);
        } else {
            post('/master/products');
        }
    };

    return (
        <>
            <Head title={isEdit ? `Edit Produk ${product?.code}` : 'Tambah Produk Baru'} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                            <Link href="/master/products">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {isEdit ? `Edit Produk: ${product?.name}` : 'Tambah Produk & Mutu Beton Baru'}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {isEdit
                                    ? `Kode Produk: ${product?.code} (Immutable)`
                                    : 'Atur spesifikasi material, harga dasar, dan aturan pengiriman armada.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Informasi Dasar & Mutu
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="category">Kategori Produk *</Label>
                                <select
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        setData({
                                            ...data,
                                            category: cat,
                                            unit: cat === 'readymix' ? 'm³' : (cat === 'cement' ? 'Sak' : 'Sak'),
                                            allow_combined_delivery: cat !== 'readymix',
                                            max_trip_capacity: cat === 'readymix' ? 7 : (cat === 'cement' ? 200 : 250),
                                        });
                                    }}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {categories.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
                            </div>

                            <div>
                                <Label htmlFor="code">Kode Produk (Opsional / Auto)</Label>
                                <Input
                                    id="code"
                                    disabled={isEdit}
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: RM-K300 atau ST-OPC"
                                    className="mt-1.5 font-mono"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Kosongkan untuk generate otomatis dari sistem.</p>
                                {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="name">Nama Lengkap Produk *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Ready Mix Beton Mutu K-300"
                                    className="mt-1.5"
                                />
                                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="base_price">Harga Dasar Satuan (Rp) *</Label>
                                <Input
                                    id="base_price"
                                    type="number"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', Number(e.target.value))}
                                    placeholder="Contoh: 890000"
                                    className="mt-1.5"
                                />
                                {errors.base_price && <p className="mt-1 text-xs text-rose-600">{errors.base_price}</p>}
                            </div>

                            <div>
                                <Label htmlFor="unit">Satuan Ukuran *</Label>
                                <Input
                                    id="unit"
                                    value={data.unit}
                                    onChange={(e) => setData('unit', e.target.value)}
                                    placeholder="m³, Sak, Ton, Kg"
                                    className="mt-1.5"
                                />
                                {errors.unit && <p className="mt-1 text-xs text-rose-600">{errors.unit}</p>}
                            </div>

                            <div>
                                <Label htmlFor="min_order">Minimal Pemesanan (Min Order)</Label>
                                <Input
                                    id="min_order"
                                    type="number"
                                    value={data.min_order}
                                    onChange={(e) => setData('min_order', Number(e.target.value))}
                                    placeholder="Contoh: 3"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="slump">Standar Slump (Khusus Ready Mix)</Label>
                                <Input
                                    id="slump"
                                    value={data.slump}
                                    onChange={(e) => setData('slump', e.target.value)}
                                    placeholder="Contoh: 12 ± 2 cm"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="tag">Tag / Badge Label (Opsional)</Label>
                                <Input
                                    id="tag"
                                    value={data.tag}
                                    onChange={(e) => setData('tag', e.target.value)}
                                    placeholder="Contoh: Terpopuler, Non-Struktural, Heavy Duty"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="recommended_for">Rekomendasi Penggunaan</Label>
                                <Input
                                    id="recommended_for"
                                    value={data.recommended_for}
                                    onChange={(e) => setData('recommended_for', e.target.value)}
                                    placeholder="Contoh: Pelat Lantai, Kolom Utama & Jalan Desa"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="description">Deskripsi Teknis</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi detail mutu dan aplikasi lapangan..."
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistic & Delivery Rule Card */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800 dark:text-white">
                            Aturan Logistik & Kapasitas Ritase Armada
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="max_trip_capacity">Batas Maksimal Muat per Armada (Kapasitas Ritase) *</Label>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <Input
                                        id="max_trip_capacity"
                                        type="number"
                                        step="0.1"
                                        value={data.max_trip_capacity}
                                        onChange={(e) => setData('max_trip_capacity', Number(e.target.value))}
                                        className="w-48"
                                    />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {data.unit} per ritase trip
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Jika volume pesanan customer melebihi batas ini (misal order 500 Ton dgn limit 300 Ton), sistem akan membagi ke multi-trip / partial delivery.
                                </p>
                                {errors.max_trip_capacity && <p className="mt-1 text-xs text-rose-600">{errors.max_trip_capacity}</p>}
                            </div>

                            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.allow_combined_delivery}
                                        onChange={(e) => setData('allow_combined_delivery', e.target.checked)}
                                        className="mt-1 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Izinkan Pengiriman Gabungan (Multi-Drop Customer)
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Centang jika produk ini (seperti semen sak/mortar) dapat dimuat bersama untuk pesanan Customer A dan Customer B dalam 1 surat jalan/truk.
                                            <br />
                                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                                                * Jangan dicentang untuk Ready Mix Mixer Truck (beton cair harus eksklusif 1 customer per pengecoran).
                                            </span>
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer font-medium">
                                    Produk Aktif & Dapat Dipesan
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/master/products">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-700 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
                        >
                            <Save className="size-4" />
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Master Produk', href: '/master/products' },
        { title: 'Form Produk', href: '#' },
    ],
};
