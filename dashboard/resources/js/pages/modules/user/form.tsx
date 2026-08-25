import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';

type Option = { id: number; code: string; name: string };
type Plant = Option & { branch_id: number };
type Role = { value: string; label: string };
type User = {
    uuid: string;
    code: string | null;
    name: string;
    email: string;
    role: string;
    branch_id: number | null;
    is_active: boolean;
    batching_plant_ids?: number[];
};

export default function UserForm({
    user,
    branches,
    plants,
    roles,
}: {
    user: User | null;
    branches: Option[];
    plants: Plant[];
    roles: Role[];
}) {
    const editing = Boolean(user);
    const [role, setRole] = useState(user?.role ?? 'user');
    const [branchId, setBranchId] = useState<string>(user?.branch_id ? String(user.branch_id) : '');
    const [selectedPlants, setSelectedPlants] = useState<number[]>(user?.batching_plant_ids ?? []);

    const filteredPlants = useMemo(
        () => plants.filter((p) => !branchId || String(p.branch_id) === branchId),
        [plants, branchId],
    );

    const togglePlant = (id: number) => {
        setSelectedPlants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    return (
        <>
            <Head title={editing ? 'Edit User' : 'Tambah User'} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">Master User</p>
                    <h1 className="font-serif text-3xl">{editing ? 'Edit user' : 'Tambah user'}</h1>
                </div>

                <Form
                    action={editing ? `/master/users/${user!.uuid}` : '/master/users'}
                    method={editing ? 'put' : 'post'}
                    className="space-y-5 rounded-xl border border-stone-200 p-5 dark:border-stone-800"
                >
                    {({ processing, errors }) => (
                        <>
                            {editing && (
                                <div className="grid gap-2">
                                    <Label>Kode</Label>
                                    <Input value={user!.code ?? ''} disabled className="font-mono" />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input id="name" name="name" defaultValue={user?.name ?? ''} required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={user?.email ?? ''} required />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password{editing ? ' (opsional)' : ''}</Label>
                                <PasswordInput id="password" name="password" required={!editing} />
                                <InputError message={errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Konfirmasi password</Label>
                                <PasswordInput id="password_confirmation" name="password_confirmation" required={!editing} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="h-9 rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700"
                                >
                                    {roles.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.role} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="branch_id">Cabang{role === 'user' ? ' (wajib)' : ' (opsional)'}</Label>
                                <select
                                    id="branch_id"
                                    name="branch_id"
                                    value={branchId}
                                    onChange={(e) => {
                                        setBranchId(e.target.value);
                                        setSelectedPlants([]);
                                    }}
                                    required={role === 'user'}
                                    className="h-9 rounded-md border border-stone-200 bg-transparent px-3 text-sm dark:border-stone-700"
                                >
                                    <option value="">{role === 'admin' ? 'HQ / lintas cabang' : 'Pilih cabang'}</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Batching plants (dalam cabang)</Label>
                                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-stone-200 p-3 dark:border-stone-700">
                                    {filteredPlants.length === 0 && (
                                        <p className="text-xs text-stone-500">Pilih cabang untuk melihat plant.</p>
                                    )}
                                    {filteredPlants.map((p) => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedPlants.includes(p.id)}
                                                onCheckedChange={() => togglePlant(p.id)}
                                            />
                                            <span className="font-mono text-xs">{p.code}</span>
                                            <span>{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedPlants.map((id) => (
                                    <input key={id} type="hidden" name="batching_plant_ids[]" value={id} />
                                ))}
                                <InputError message={errors.batching_plant_ids} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="is_active" name="is_active" value="1" defaultChecked={user?.is_active ?? true} />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />} Simpan
                                </Button>
                                <Button asChild type="button" variant="secondary">
                                    <Link href="/master/users">Batal</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

UserForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: '/master/users' },
        { title: 'Form', href: '#' },
    ],
};
