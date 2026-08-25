import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600/30 dark:bg-emerald-600 dark:ring-emerald-500/40">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {name || 'PKM Portal'}
                </span>
                <span className="text-[10px] font-medium tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                    Tonasa Group
                </span>
            </div>
        </div>
    );
}


