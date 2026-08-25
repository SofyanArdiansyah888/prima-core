import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type PlantRate = {
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
};

export default function DeliveryRateForm({
    rate,
    plants,
    rateTypes,
}: {
    rate: PlantRate | null;
    plants: { id: number; uuid: string; code: string; name: string }[];
    rateTypes: { value: string; label: string }[];
}) {
    const isEdit = Boolean(rate);

    const { data, setData, post, put, processing, errors } = useForm({
        batching_plant_id: rate?.batching_plant_id ?? plants[0]?.id ?? '',
        product_category: rate?.product_category ?? '',
        min_distance_km: rate?.min_distance_km ?? 0,
        max_distance_km: rate?.max_distance_km ?? '',
        rate_type: rate?.rate_type ?? 'PER_UNIT_PER_KM',
        base_fee: rate?.base_fee ?? '',
        cost_per_km_unit: rate?.cost_per_km_unit ?? '',
        min_charge: rate?.min_charge ?? '',
        notes: rate?.notes ?? '',
        is_active: rate?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/master/delivery-rates/${rate!.uuid}`);
        } else {
            post('/master/delivery-rates');
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Tarif Pengantaran' : 'Tambah Tarif Pengantaran'} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href="/master/delivery-rates">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isEdit ? 'Edit Tarif Pengantaran Plant' : 'Tambah Aturan Tarif Pengantaran Plant'}
                        </h1>
                        <p className="text-xs text-slate-500">
                            Atur perhitungan ongkir berdasarkan radius dan jarak plant ke lokasi proyek.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <Route className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Konfigurasi Zona & Formula Biaya
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="batching_plant_id">Batching Plant *</Label>
                                <select
                                    id="batching_plant_id"
                                    value={data.batching_plant_id}
                                    onChange={(e) => setData('batching_plant_id', Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {plants.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.batching_plant_id && <p className="mt-1 text-xs text-rose-600">{errors.batching_plant_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="min_distance_km">Jarak Minimum (Km) *</Label>
                                <Input
                                    id="min_distance_km"
                                    type="number"
                                    step="0.1"
                                    value={data.min_distance_km}
                                    onChange={(e) => setData('min_distance_km', Number(e.target.value))}
                                    className="mt-1.5"
                                />
                                {errors.min_distance_km && <p className="mt-1 text-xs text-rose-600">{errors.min_distance_km}</p>}
                            </div>

                            <div>
                                <Label htmlFor="max_distance_km">Jarak Maksimum (Km) *</Label>
                                <Input
                                    id="max_distance_km"
                                    type="number"
                                    step="0.1"
                                    value={data.max_distance_km}
                                    onChange={(e) => setData('max_distance_km', Number(e.target.value))}
                                    className="mt-1.5"
                                />
                                {errors.max_distance_km && <p className="mt-1 text-xs text-rose-600">{errors.max_distance_km}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="rate_type">Metode Kalkulasi Tarif *</Label>
                                <select
                                    id="rate_type"
                                    value={data.rate_type}
                                    onChange={(e) => setData('rate_type', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {rateTypes.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="base_fee">Biaya Dasar (Base Fee Rp) *</Label>
                                <Input
                                    id="base_fee"
                                    type="number"
                                    value={data.base_fee}
                                    onChange={(e) => setData('base_fee', Number(e.target.value))}
                                    placeholder="Contoh: 150000"
                                    className="mt-1.5"
                                />
                                {errors.base_fee && <p className="mt-1 text-xs text-rose-600">{errors.base_fee}</p>}
                            </div>

                            <div>
                                <Label htmlFor="cost_per_km_unit">Tarif Tambahan / Km / Unit (Rp)</Label>
                                <Input
                                    id="cost_per_km_unit"
                                    type="number"
                                    value={data.cost_per_km_unit}
                                    onChange={(e) => setData('cost_per_km_unit', Number(e.target.value))}
                                    placeholder="Contoh: 12000"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="min_charge">Minimal Biaya Ongkir (Min Charge Rp)</Label>
                                <Input
                                    id="min_charge"
                                    type="number"
                                    value={data.min_charge}
                                    onChange={(e) => setData('min_charge', Number(e.target.value))}
                                    placeholder="Contoh: 250000"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="notes">Catatan Zona / Keterangan</Label>
                                <Textarea
                                    id="notes"
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Contoh: Radius Ring 1 Kota Pangkep & Kawasan Pabrik"
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/master/delivery-rates">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-700 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
                        >
                            <Save className="size-4" />
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Tarif'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

DeliveryRateForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Tarif Pengantaran', href: '/master/delivery-rates' },
        { title: 'Form Tarif', href: '#' },
    ],
};
