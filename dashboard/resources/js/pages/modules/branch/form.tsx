import { Form, Head, Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
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
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                            Master Data · Wilayah
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        {editing ? 'Edit Cabang Operasional' : 'Tambah Cabang Baru'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {editing
                            ? 'Perbarui informasi kantor cabang. Kode cabang bersifat permanen/immutable.'
                            : 'Daftarkan cabang operasional baru. Kode cabang akan dibuat otomatis.'}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
                    <Form
                        action={editing ? `/master/branches/${branch!.uuid}` : '/master/branches'}
                        method={editing ? 'put' : 'post'}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                {!editing && (
                                    <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <Label htmlFor="region" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Region / Wilayah (3–6 Karakter) <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="region"
                                            name="region"
                                            placeholder="Contoh: SULSEL atau JATIM"
                                            required
                                            className="h-10 border-slate-200 uppercase font-mono text-sm tracking-wider font-semibold focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Format penomoran otomatis: <span className="font-mono font-bold text-slate-900 dark:text-white">BR-[REGION]-NN</span> (tidak dapat diubah setelah dibuat).
                                        </p>
                                        <InputError message={errors.region} />
                                        <InputError message={errors.code} />
                                    </div>
                                )}

                                {editing && (
                                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Kode Cabang (Permanen / Immutable)
                                        </Label>
                                        <div className="mt-1.5">
                                            <Input
                                                value={branch!.code}
                                                disabled
                                                className="h-10 bg-white font-mono text-sm font-semibold text-slate-800 shadow-none dark:bg-slate-900 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nama Cabang <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={branch?.name ?? ''}
                                        placeholder="Contoh: Cabang Sulawesi Selatan"
                                        required
                                        className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Alamat Kantor
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        defaultValue={branch?.address ?? ''}
                                        placeholder="Alamat lengkap operasional kantor cabang"
                                        className="h-10 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nomor Telepon
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={branch?.phone ?? ''}
                                        placeholder="Contoh: 0411-123456"
                                        className="h-10 border-slate-200 font-mono text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:border-slate-800"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <Checkbox
                                        id="is_active"
                                        name="is_active"
                                        value="1"
                                        defaultChecked={branch?.is_active ?? true}
                                    />
                                    <div className="grid gap-0.5">
                                        <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                                            Status Cabang Aktif
                                        </Label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Cabang aktif dapat memiliki batching plant dan menampung personil operator.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-10 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                    >
                                        {processing && <Spinner />} Simpan Cabang
                                    </Button>
                                    <Button asChild type="button" variant="outline" className="h-10 border-slate-200 font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                                        <Link href="/master/branches">Batal</Link>
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

BranchForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Cabang', href: '/master/branches' },
        { title: 'Form Cabang', href: '#' },
    ],
};


