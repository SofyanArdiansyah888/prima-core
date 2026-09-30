import { Head, Link, router, usePage } from '@inertiajs/react';
import { MapPin, Plus, Route, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { dashboard } from '@/routes';

type PlantRateRow = {
    id: number;
    uuid: string;
    batching_plant_id: number;
    product_category: string | null;
    min_distance_km: number;
    max_distance_km: number;
    rate_type: string;
    base_fee: number;
    cost_per_km_unit: number;
    min_charge: number;
    notes: string | null;
    is_active: boolean;
    batching_plant: {
        id: number;
        uuid: string;
        code: string;
        name: string;
        branch?: { code: string; name: string };
    };
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function DeliveryRateIndex({
    rates,
    plants,
    filters,
}: {
    rates: Paginated<PlantRateRow>;
    plants: { id: number; uuid: string; code: string; name: string }[];
    filters: { batching_plant_id?: string };
}) {
    const [selectedPlant, setSelectedPlant] = useState(filters.batching_plant_id ?? '');
    const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const handlePlantFilter = (plantId: string) => {
        setSelectedPlant(plantId);
        router.get('/master/delivery-rates', { batching_plant_id: plantId }, { preserveState: true });
    };

    return (
        <>
            <Head title="Master Tarif Pengantaran Batching Plant" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Logistik & Pengantaran PKM
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Tarif Pengantaran & Radius Plant
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Konfigurasi matriks ongkos kirim tiap Batching Plant berdasarkan jarak kilometer dan kategori produk.
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-9 bg-[#0c1d37] font-medium text-white shadow-xs hover:bg-[#162e55] dark:bg-slate-800 dark:hover:bg-slate-700">
                        <Link href="/master/delivery-rates/create">
                            <Plus className="size-4" /> Tambah Tarif Plant
                        </Link>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <MapPin className="size-4 text-slate-400 shrink-0" />
                        <select
                            value={selectedPlant}
                            onChange={(e) => handlePlantFilter(e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Semua Batching Plant</option>
                            {plants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <span className="font-bold text-slate-900 dark:text-white">{rates.total ?? rates.data.length}</span> aturan tarif
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Batching Plant</th>
                                    <th className="px-5 py-3.5">Zona Radius Jarak</th>
                                    <th className="px-5 py-3.5">Metode Tarif</th>
                                    <th className="px-5 py-3.5">Biaya Dasar (Base Fee)</th>
                                    <th className="px-5 py-3.5">Tarif / Km / Unit</th>
                                    <th className="px-5 py-3.5">Min Charge</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rates.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Route className="size-5 text-slate-400" />
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Belum ada tarif pengantaran</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Atur zona radius dan tarif ongkos kirim per plant.
                                                </p>
                                                <Button asChild size="sm" variant="outline" className="mt-4">
                                                    <Link href="/master/delivery-rates/create">Tambah Tarif Baru</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {rates.data.map((r) => (
                                    <tr key={r.uuid} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                                            <div>
                                                <p>{r.batching_plant?.name}</p>
                                                <span className="font-mono text-xs text-slate-500">{r.batching_plant?.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                {Number(r.min_distance_km)} - {Number(r.max_distance_km)} Km
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center rounded-md border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                                                {r.rate_type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                            Rp {Number(r.base_fee).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                                            Rp {Number(r.cost_per_km_unit).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                                            Rp {Number(r.min_charge).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                                    <Link href={`/master/delivery-rates/${r.uuid}/edit`}>Edit</Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                    onClick={() => setDeleteTargetUuid(r.uuid)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ConfirmModal
                    open={Boolean(deleteTargetUuid)}
                    onOpenChange={(open) => {
                        if (!open) setDeleteTargetUuid(null);
                    }}
                    title="Hapus Aturan Tarif"
                    description="Apakah Anda yakin ingin menghapus aturan tarif pengantaran batching plant ini? Tindakan ini tidak dapat dibatalkan."
                    variant="destructive"
                    confirmText="Hapus Tarif"
                    cancelText="Batal"
                    onConfirm={() => {
                        if (deleteTargetUuid) {
                            router.delete(`/master/delivery-rates/${deleteTargetUuid}`);
                            setDeleteTargetUuid(null);
                        }
                    }}
                />
            </div>
        </>
    );
}

DeliveryRateIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tarif Pengantaran', href: '/master/delivery-rates' },
    ],
};
