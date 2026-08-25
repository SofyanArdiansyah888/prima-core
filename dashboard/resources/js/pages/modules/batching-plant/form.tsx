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
            <Head title={editing ? 'Edit Plant' : 'Tambah Plant'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master Batching Plant</p>
                    <h1 className="font-serif text-3xl">{editing ? 'Edit plant' : 'Tambah plant'}</h1>
                </div>

                <Form
                    action={editing ? `/master/batching-plants/${plant!.uuid}` : '/master/batching-plants'}
                    method={editing ? 'put' : 'post'}
                    className="space-y-5 rounded-xl border border-stone-200 p-5 dark:border-stone-800"
                >
                    {({ processing, errors }) => (
                        <>
                            {editing && (
                                <div className="grid gap-2">
                                    <Label>Kode</Label>
                                    <Input value={plant!.code} disabled className="font-mono" />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="branch_id">Cabang</Label>
                                <select id="branch_id" name="branch_id" required defaultValue={plant?.branch_id ?? ''} className="h-9 rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700">
                                    <option value="" disabled>Pilih cabang</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input id="name" name="name" defaultValue={plant?.name ?? ''} required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Input id="address" name="address" defaultValue={plant?.address ?? ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telepon</Label>
                                <Input id="phone" name="phone" defaultValue={plant?.phone ?? ''} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="lat">Latitude</Label>
                                    <Input id="lat" name="lat" type="number" step="any" defaultValue={plant?.lat ?? ''} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lng">Longitude</Label>
                                    <Input id="lng" name="lng" type="number" step="any" defaultValue={plant?.lng ?? ''} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="daily_capacity_m3">Kapasitas harian (m³)</Label>
                                <Input id="daily_capacity_m3" name="daily_capacity_m3" type="number" defaultValue={plant?.daily_capacity_m3 ?? ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select id="status" name="status" defaultValue={plant?.status ?? 'OPERATIONAL'} className="h-9 rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700">
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="is_active" name="is_active" value="1" defaultChecked={plant?.is_active ?? true} />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />} Simpan
                                </Button>
                                <Button asChild type="button" variant="secondary">
                                    <Link href="/master/batching-plants">Batal</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

PlantForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Batching Plants', href: '/master/batching-plants' },
        { title: 'Form', href: '#' },
    ],
};
