import { Form, Head, Link } from '@inertiajs/react';
import { Building2, Check, Factory, KeyRound, ShieldAlert, User as UserIcon } from 'lucide-react';
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
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                            Master Data · Hak Akses
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        {editing ? 'Edit Personil' : 'Tambah Personil Baru'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {editing
                            ? 'Perbarui profil pengguna, peran, dan otorisasi batching plant.'
                            : 'Daftarkan personil baru. Kode karyawan digenerate otomatis sesuai format industri Tonasa.'}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
                    <Form
                        action={editing ? `/master/users/${user!.uuid}` : '/master/users'}
                        method={editing ? 'put' : 'post'}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                {editing && (
                                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Kode Karyawan (Permanen / Immutable)
                                        </Label>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <Input
                                                value={user!.code ?? 'EMP-HQ-…'}
                                                disabled
                                                className="h-10 bg-white font-mono text-sm font-semibold text-slate-800 shadow-none dark:bg-slate-900 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Account Information Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                        <UserIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            Informasi Profil Akun
                                        </h2>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Nama Lengkap <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={user?.name ?? ''}
                                            required
                                            placeholder="Contoh: Muhammad Ilham"
                                            className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Alamat Email <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={user?.email ?? ''}
                                            required
                                            placeholder="operator@pkm.test"
                                            className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {!editing && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Password <span className="text-rose-500">*</span>
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Minimal 8 karakter"
                                                    className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Ulangi Password <span className="text-rose-500">*</span>
                                                </Label>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Konfirmasi password"
                                                    className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                                />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Role & Authorization Section */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                        <KeyRound className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            Peran & Penugasan Wilayah
                                        </h2>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Peran Sistem <span className="text-rose-500">*</span>
                                            </Label>
                                            <select
                                                id="role"
                                                name="role"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                            >
                                                {roles.map((r) => (
                                                    <option key={r.value} value={r.value}>
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.role} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="branch_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Cabang Penugasan
                                            </Label>
                                            <select
                                                id="branch_id"
                                                name="branch_id"
                                                value={branchId}
                                                onChange={(e) => setBranchId(e.target.value)}
                                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                            >
                                                <option value="">HQ (Lintas Cabang / Kantor Pusat)</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.code} — {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.branch_id} />
                                        </div>
                                    </div>

                                    {/* Batching Plant Selection */}
                                    <div className="space-y-2.5 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Otorisasi Akses Batching Plant
                                            </Label>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {selectedPlants.length} dipilih
                                            </span>
                                        </div>

                                        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950/40">
                                            {filteredPlants.length === 0 && (
                                                <p className="col-span-2 py-3 text-center text-xs text-slate-400">
                                                    Tidak ada batching plant pada cabang ini.
                                                </p>
                                            )}
                                            {filteredPlants.map((p) => {
                                                const checked = selectedPlants.includes(p.id);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => togglePlant(p.id)}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all ${
                                                            checked
                                                                ? 'border-emerald-500/60 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-950/40'
                                                                : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={() => togglePlant(p.id)}
                                                        />
                                                        <div className="grid flex-1 leading-tight">
                                                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                                {p.code}
                                                            </span>
                                                            <span className="truncate text-xs text-slate-600 dark:text-slate-300">
                                                                {p.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {selectedPlants.map((id) => (
                                            <input key={id} type="hidden" name="batching_plant_ids[]" value={id} />
                                        ))}
                                        <InputError message={errors.batching_plant_ids} />
                                    </div>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <Checkbox
                                        id="is_active"
                                        name="is_active"
                                        value="1"
                                        defaultChecked={user?.is_active ?? true}
                                    />
                                    <div className="grid gap-0.5">
                                        <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                                            Status Akun Aktif
                                        </Label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            User nonaktif tidak dapat masuk atau melakukan transaksi di dashboard PKM.
                                        </p>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-10 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                    >
                                        {processing && <Spinner />} Simpan Pengguna
                                    </Button>
                                    <Button asChild type="button" variant="outline" className="h-10 border-slate-200 font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                                        <Link href="/master/users">Batal</Link>
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

UserForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: '/master/users' },
        { title: 'Form User', href: '#' },
    ],
};
