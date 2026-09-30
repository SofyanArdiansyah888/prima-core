import { Link, usePage } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative flex min-h-svh">
            <div className="relative hidden w-[52%] overflow-hidden lg:block">
                <img
                    src="/images/login-plant.jpg"
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-[#0c1d37]/80 backdrop-blur-xs" />
                <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
                    <Link href={home()} className="flex items-center gap-3">
                        <img
                            src="/logo-pkm.svg"
                            alt="Logo PT. Prima Karya Manunggal Semen Tonasa"
                            className="size-10 object-contain drop-shadow-sm"
                        />
                        <div className="leading-tight">
                            <span className="text-base font-extrabold tracking-wide text-white block">
                                {name || 'PKM Tonasa'}
                            </span>
                            <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider">
                                Semen Tonasa Group
                            </span>
                        </div>
                    </Link>
                    <div className="max-w-md space-y-3">
                        <div className="flex h-1.5 w-24 rounded-full overflow-hidden mb-2">
                            <div className="h-full w-1/3 bg-[#d91424]" />
                            <div className="h-full w-1/3 bg-[#ea580c]" />
                            <div className="h-full w-1/3 bg-white" />
                        </div>
                        <p className="text-xs font-bold tracking-[0.22em] text-[#ea580c] uppercase">
                            Operasional Ready-Mix & Semen
                        </p>
                        <h2 className="text-3xl font-extrabold leading-tight text-white">
                            Kendalikan cabang, plant, dan armada dari satu portal terpadu.
                        </h2>
                        <p className="text-sm text-slate-200">
                            PT Prima Karya Manunggal — Semen Tonasa Group (SIG)
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center bg-background px-6 py-12">
                <img
                    src="/images/login-plant.jpg"
                    alt=""
                    className="absolute inset-0 size-full object-cover lg:hidden"
                />
                <div className="absolute inset-0 bg-[#0c1d37]/85 lg:hidden" />

                <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-slate-200 bg-background p-8 shadow-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                    <Link
                        href={home()}
                        className="mb-8 flex items-center gap-3 lg:hidden"
                    >
                        <img
                            src="/logo-pkm.svg"
                            alt="Logo PT. Prima Karya Manunggal"
                            className="size-10 object-contain"
                        />
                        <div className="leading-tight">
                            <span className="text-sm font-extrabold text-foreground block">{name}</span>
                            <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider">Semen Tonasa</span>
                        </div>
                    </Link>
                    <div className="mb-8 space-y-1.5">
                        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

