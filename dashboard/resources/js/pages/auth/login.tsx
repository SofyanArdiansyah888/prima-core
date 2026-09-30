import { Form, Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldAlert } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk ke Portal Operasional" />

            {status && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 shadow-2xs">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>{status}</span>
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4.5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-800">
                                Email Pengguna
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="operator@pkm.test"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs font-medium placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0c1d37] focus-visible:ring-2 focus-visible:ring-[#0c1d37]/15 transition-all"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-bold text-slate-800">
                                    Kata Sandi
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] transition-colors"
                                        tabIndex={5}
                                    >
                                        Lupa kata sandi?
                                    </TextLink>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Masukkan kata sandi"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs font-medium placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0c1d37] focus-visible:ring-2 focus-visible:ring-[#0c1d37]/15 transition-all"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer">
                                    Ingat saya di perangkat ini
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] text-xs font-bold text-white shadow-md shadow-[#0c1d37]/20 hover:from-[#091528] hover:to-[#091528] active:scale-[0.99] transition-all cursor-pointer"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing ? (
                                <Spinner className="size-4 text-white" />
                            ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                    <span>Masuk ke Dashboard</span>
                                    <ArrowRight className="size-3.5" />
                                </div>
                            )}
                        </Button>

                        <div className="mt-2 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-center">
                            <p className="text-[11px] leading-relaxed text-slate-500">
                                Akses internal terbatas untuk staf, operator, dan manajemen{' '}
                                <span className="font-bold text-[#0c1d37]">PT Prima Karya Manunggal</span>.
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Portal Masuk Operasional',
    description: 'Silakan masukkan kredensial akun Anda untuk mengakses sistem terpadu PKM.',
};

