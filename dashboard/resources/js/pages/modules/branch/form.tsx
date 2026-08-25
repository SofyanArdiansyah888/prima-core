import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';

type Branch = {
    uuid: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
};

export default function BranchForm({ branch }: { branch: Branch | null }) {
    const editing = Boolean(branch);

    return (
        <>
            <Head title={editing ? 'Edit Cabang' : 'Tambah Cabang'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master Cabang</p>
                    <h1 className="font-serif text-3xl">{editing ? 'Edit cabang' : 'Tambah cabang'}</h1>
                </div>

                <Form
                    action={editing ? `/master/branches/${branch!.uuid}` : '/master/branches'}
                    method={editing ? 'put' : 'post'}
                    className="space-y-5 rounded-xl border border-stone-200 p-5 dark:border-stone-800"
                >
                    {({ processing, errors }) => (
                        <>
                            {!editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="region">Region (3–6 huruf)</Label>
                                    <Input id="region" name="region" placeholder="SULSEL" required className="uppercase" />
                                    <p className="text-xs text-stone-500">Kode otomatis: BR-REGION-NN (immutable setelah dibuat)</p>
                                    <InputError message={errors.region} />
                                    <InputError message={errors.code} />
                                </div>
                            )}
                            {editing && (
                                <div className="grid gap-2">
                                    <Label>Kode</Label>
                                    <Input value={branch!.code} disabled className="font-mono" />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input id="name" name="name" defaultValue={branch?.name ?? ''} required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Input id="address" name="address" defaultValue={branch?.address ?? ''} />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telepon</Label>
                                <Input id="phone" name="phone" defaultValue={branch?.phone ?? ''} />
                                <InputError message={errors.phone} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="is_active" name="is_active" value="1" defaultChecked={branch?.is_active ?? true} />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />} Simpan
                                </Button>
                                <Button asChild type="button" variant="secondary">
                                    <Link href="/master/branches">Batal</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

BranchForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Cabang', href: '/master/branches' },
        { title: 'Form', href: '#' },
    ],
};
