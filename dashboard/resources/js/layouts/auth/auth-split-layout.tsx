import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
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
                <div className="absolute inset-0 bg-stone-950/55" />
                <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
                    <Link href={home()} className="flex items-center gap-3">
                        <AppLogoIcon className="size-8 fill-current" />
                        <span className="text-sm font-medium tracking-wide">{name}</span>
                    </Link>
                    <div className="max-w-md space-y-3">
                        <p className="text-xs font-semibold tracking-[0.22em] text-emerald-300 uppercase">
                            Operasional ready-mix
                        </p>
                        <h2 className="font-serif text-4xl leading-tight text-white">
                            Kendalikan cabang, plant, dan tim dari satu dashboard.
                        </h2>
                        <p className="text-sm text-stone-200">
                            PT Prima Karya Manunggal — Semen Tonasa Group
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
                <div className="absolute inset-0 bg-stone-950/70 lg:hidden" />

                <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-stone-200 bg-background p-8 shadow-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                    <Link
                        href={home()}
                        className="mb-8 flex items-center gap-2 lg:hidden"
                    >
                        <AppLogoIcon className="size-8 fill-current text-foreground" />
                        <span className="text-sm font-medium">{name}</span>
                    </Link>
                    <div className="mb-8 space-y-2">
                        <h1 className="font-serif text-2xl text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
