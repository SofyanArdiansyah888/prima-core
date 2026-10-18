import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Image, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type Banner = {
    uuid: string;
    code: string;
    badge: string;
    title: string;
    description: string | null;
    cta_label: string;
    category_id: number | null;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    image_url: string;
};

function dateInput(value: string | null): string {
    if (!value) return '';
    return value.slice(0, 16);
}

export default function BannerForm({
    banner,
    categories,
}: {
    banner: Banner | null;
    categories: { id: number; name: string }[];
}) {
    const editing = Boolean(banner);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const { data, setData, post, processing, errors, transform } = useForm<{
        badge: string;
        title: string;
        description: string;
        cta_label: string;
        category_id: string;
        image: File | null;
        sort_order: number;
        is_active: boolean;
        starts_at: string;
        ends_at: string;
    }>({
        badge: banner?.badge ?? '',
        title: banner?.title ?? '',
        description: banner?.description ?? '',
        cta_label: banner?.cta_label ?? '',
        category_id: banner?.category_id ? String(banner.category_id) : '',
        image: null,
        sort_order: banner?.sort_order ?? 0,
        is_active: banner?.is_active ?? true,
        starts_at: dateInput(banner?.starts_at ?? null),
        ends_at: dateInput(banner?.ends_at ?? null),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing && banner) {
            transform((payload) => ({ ...payload, _method: 'put' }));
            post(`/master/banners/${banner.uuid}`, { forceFormData: true });
            return;
        }
        post('/master/banners', { forceFormData: true });
    };

    return (
        <>
            <Head title={editing ? 'Edit Banner' : 'Tambah Banner'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9">
                        <Link href="/master/banners">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{editing ? `Edit Banner ${banner?.code}` : 'Tambah Banner'}</h1>
                        <p className="text-xs text-slate-500">Gambar, teks, dan kategori tujuan tombol di slider beranda.</p>
                    </div>
                </div>
                <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6 dark:bg-slate-900">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <Image className="size-5 text-emerald-600" />
                        <h2 className="font-semibold">Isi slider</h2>
                    </div>
                    {banner?.image_url && <img src={banner.image_url} alt="" className="h-32 w-full rounded-lg object-cover" />}
                    <div>
                        <Label htmlFor="badge">Lencana *</Label>
                        <Input id="badge" value={data.badge} onChange={(e) => setData('badge', e.target.value)} className="mt-1.5" />
                        {errors.badge && <p className="mt-1 text-xs text-rose-600">{errors.badge}</p>}
                    </div>
                    <div>
                        <Label htmlFor="title">Judul *</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} className="mt-1.5" />
                        {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                    </div>
                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="cta_label">Teks tombol *</Label>
                            <Input id="cta_label" value={data.cta_label} onChange={(e) => setData('cta_label', e.target.value)} className="mt-1.5" />
                            {errors.cta_label && <p className="mt-1 text-xs text-rose-600">{errors.cta_label}</p>}
                        </div>
                        <div>
                            <Label htmlFor="category_id">Kategori tujuan</Label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                                <option value="">Tanpa filter kategori</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="image">Gambar {editing ? '' : '*'}</Label>
                            <Input id="image" type="file" accept="image/*" className="mt-1.5" onChange={(e) => setData('image', e.target.files?.[0] ?? null)} />
                            {errors.image && <p className="mt-1 text-xs text-rose-600">{errors.image}</p>}
                        </div>
                        <div>
                            <Label htmlFor="sort_order">Urutan</Label>
                            <Input id="sort_order" type="number" value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} className="mt-1.5" />
                        </div>
                        <div>
                            <Label htmlFor="starts_at">Mulai tayang</Label>
                            <Input id="starts_at" type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} className="mt-1.5" />
                        </div>
                        <div>
                            <Label htmlFor="ends_at">Selesai tayang</Label>
                            <Input id="ends_at" type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} className="mt-1.5" />
                            {errors.ends_at && <p className="mt-1 text-xs text-rose-600">{errors.ends_at}</p>}
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        Aktif
                    </label>
                    <div className="flex justify-between">
                        {editing && banner ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
                                onClick={() => setShowDeleteModal(true)}
                                disabled={processing}
                            >
                                <Trash2 className="mr-1.5 size-4" />
                                Hapus Banner
                            </Button>
                        ) : <span />}
                        <Button type="submit" disabled={processing} className="bg-[#0c1d37] text-white hover:bg-[#162e55]">Simpan</Button>
                    </div>
                </form>

                <ConfirmModal
                    open={showDeleteModal}
                    onOpenChange={setShowDeleteModal}
                    title="Hapus Banner Beranda"
                    description={`Apakah Anda yakin ingin menghapus banner "${banner?.title}" (${banner?.code})? Tindakan ini akan menghapus banner dan file gambar terkait.`}
                    variant="destructive"
                    confirmText="Hapus Banner"
                    cancelText="Batal"
                    onConfirm={() => {
                        if (banner) {
                            router.delete(`/master/banners/${banner.uuid}`, {
                                preserveScroll: true,
                                onFinish: () => setShowDeleteModal(false),
                            });
                        }
                    }}
                />
            </div>
        </>
    );
}

BannerForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Banner Beranda', href: '/master/banners' },
        { title: 'Form', href: '#' },
    ],
};
