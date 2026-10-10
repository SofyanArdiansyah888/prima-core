import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';

type Option = { id: number; code: string; name: string };
type Status = { value: string; label: string };
type Plant = {
    uuid: string;
    code: string;
    branch_id: number;
    name: string;
    address: string | null;
    phone: string | null;
    lat: string | number | null;
    lng: string | number | null;
    daily_capacity_m3: number | null;
    status: string;
    is_active: boolean;
};

export default function PlantForm({
    plant,
    branches,
    statuses,
}: {
    plant: Plant | null;
    branches: Option[];
    statuses: Status[];
}) {
    const editing = Boolean(plant);

    return (
        <>
            <Head title={editing ? 'Edit Batching Plant' : 'Tambah Batching Plant'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                            Master Data · Unit Produksi
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        {editing ? 'Edit Batching Plant' : 'Tambah Plant Baru'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {editing
                            ? 'Perbarui data teknis dan operasional batching plant. Kode plant bersifat permanen.'
                            : 'Registrasikan unit produksi ready-mix baru di bawah cabang yang dipilih.'}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
                    <Form
                        action={editing ? `/master/batching-plants/${plant!.uuid}` : '/master/batching-plants'}
                        method={editing ? 'put' : 'post'}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                {editing && (
                                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Kode Plant (Permanen / Immutable)
                                        </Label>
                                        <div className="mt-1.5">
                                            <Input
                                                value={plant!.code}
                                                disabled
                                                className="h-10 bg-white font-mono text-sm font-semibold text-slate-800 shadow-none dark:bg-slate-900 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="branch_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Cabang Induk <span className="text-rose-500">*</span>
                                    </Label>
                                    {editing && <input type="hidden" name="branch_id" value={plant!.branch_id} />}
                                    <select
                                        id="branch_id"
                                        name={editing ? undefined : 'branch_id'}
                                        required={!editing}
                                        defaultValue={plant?.branch_id ?? ''}
                                        disabled={editing}
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-800"
                                    >
                                        <option value="" disabled>Pilih cabang operasional</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.code} — {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    {!editing && (
                                        <p className="text-xs text-slate-500">
                                            Format kode otomatis: <span className="font-mono font-bold text-slate-900 dark:text-white">[KODE_CABANG]-BP-NN</span>
                                        </p>
                                    )}
                                    <InputError message={errors.branch_id} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nama Batching Plant <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={plant?.name ?? ''}
                                        placeholder="Contoh: BP-01 Pangkep Utama"
                                        required
                                        className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Lokasi / Alamat Plant
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        defaultValue={plant?.address ?? ''}
                                        placeholder="Alamat lengkap lokasi fisik batching plant"
                                        className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Telepon Plant
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            defaultValue={plant?.phone ?? ''}
                                            placeholder="Contoh: 0411-987654"
                                            className="h-10 border-slate-200 font-mono text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="daily_capacity_m3" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Kapasitas Harian (m³)
                                        </Label>
                                        <Input
                                            id="daily_capacity_m3"
                                            name="daily_capacity_m3"
                                            type="number"
                                            defaultValue={plant?.daily_capacity_m3 ?? ''}
                                            placeholder="Contoh: 500"
                                            className="h-10 border-slate-200 font-mono text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                        />
                                        <InputError message={errors.daily_capacity_m3} />
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Koordinat GPS (Opsional)
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lat" className="text-[11px] font-medium text-slate-500">
                                                Latitude
                                            </Label>
                                            <Input
                                                id="lat"
                                                name="lat"
                                                type="number"
                                                step="any"
                                                defaultValue={plant?.lat ?? ''}
                                                placeholder="-4.78912"
                                                className="h-9 border-slate-200 bg-white font-mono text-xs focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-700 dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lng" className="text-[11px] font-medium text-slate-500">
                                                Longitude
                                            </Label>
                                            <Input
                                                id="lng"
                                                name="lng"
                                                type="number"
                                                step="any"
                                                defaultValue={plant?.lng ?? ''}
                                                placeholder="119.5678"
                                                className="h-9 border-slate-200 bg-white font-mono text-xs focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-700 dark:bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Status Operasional
                                    </Label>
                                    <select
                                        id="status"
                                        name="status"
                                        defaultValue={plant?.status ?? 'OPERATIONAL'}
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <Checkbox
                                        id="is_active"
                                        name="is_active"
                                        value="1"
                                        defaultChecked={plant?.is_active ?? true}
                                    />
                                    <div className="grid gap-0.5">
                                        <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                                            Plant Aktif
                                        </Label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Nonaktifkan jika plant sedang tidak beroperasi sementara atau ditutup.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-10 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                    >
                                        {processing && <Spinner />} Simpan Plant
                                    </Button>
                                    <Button asChild type="button" variant="outline" className="h-10 border-slate-200 font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                                        <Link href="/master/batching-plants">Batal</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

PlantForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Batching Plants', href: '/master/batching-plants' },
        { title: 'Form Plant', href: '#' },
    ],
};


