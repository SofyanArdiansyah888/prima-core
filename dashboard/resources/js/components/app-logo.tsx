import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-3">
            <img
                src="/logo-pkm.svg"
                alt="Logo PT. Prima Karya Manunggal Semen Tonasa"
                className="size-9 object-contain drop-shadow-xs shrink-0"
            />
            <div className="grid flex-1 text-left leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-extrabold tracking-tight text-white">
                        {name || 'PKM Portal'}
                    </span>
                    <span className="rounded bg-[#d91424] px-1 py-0.2 text-[8px] font-extrabold text-white uppercase tracking-wider">
                        Resmi
                    </span>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-[#ea580c] uppercase truncate">
                    Semen Tonasa Group
                </span>
            </div>
        </div>
    );
}



