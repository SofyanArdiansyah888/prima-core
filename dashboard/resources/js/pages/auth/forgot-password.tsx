import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Lupa Kata Sandi" />

            {status && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>{status}</span>
                </div>
            )}

            <div className="space-y-5">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-1.5">
                                <Label htmlFor="email" className="text-xs font-bold text-slate-800">
                                    Alamat Email Terdaftar
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="operator@pkm.test"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs font-medium placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0c1d37] focus-visible:ring-2 focus-visible:ring-[#0c1d37]/15 transition-all"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] text-xs font-bold text-white shadow-md shadow-[#0c1d37]/20 hover:from-[#091528] hover:to-[#091528] active:scale-[0.99] transition-all cursor-pointer"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing ? (
                                        <LoaderCircle className="size-4 animate-spin text-white" />
                                    ) : (
                                        <span>Kirim Tautan Atur Ulang Kata Sandi</span>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="text-center">
                    <TextLink
                        href={login()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c1d37] hover:text-[#ea580c] transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke halaman masuk</span>
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Atur Ulang Kata Sandi',
    description: 'Masukkan email akun Anda untuk menerima tautan pemulihan kata sandi.',
};

