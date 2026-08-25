import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Building2, CheckCircle2, Factory, Plus, ShieldCheck, Users } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type Stats = {
    branches: number;
    plants: number;
    users: number;
};

export default function Dashboard({ stats }: { stats: Stats }) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const cards = [
        {
            label: 'Cabang Wilayah',
            codePrefix: 'BR-REGION-NN',
            value: stats.branches,
            href: '/master/branches',
            icon: Building2,
            unit: 'Kantor cabang aktif',
            badge: '100% Aktif',
            accent: 'from-emerald-500 to-teal-600',
        },
        {
            label: 'Batching Plant',
            codePrefix: 'BR-*-BP-NN',
            value: stats.plants,
            href: '/master/batching-plants',
            icon: Factory,
            unit: 'Unit produksi ready-mix',
            badge: 'Siap Operasi',
            accent: 'from-teal-500 to-emerald-600',
        },
        {
            label: 'Pengguna & Operator',
            codePrefix: 'EMP-*-YYYY#####',
            value: stats.users,
            href: '/master/users',
            icon: Users,
            unit: 'Personil terotorisasi',
            badge: 'Role Scoped',
            accent: 'from-emerald-600 to-green-600',
        },
    ];

    return (
        <>
            <Head title="Dashboard Operasional" />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                                Tonasa Ready-Mix Network
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                PT Prima Karya Manunggal
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Ringkasan Operasional
                        </h1>
                        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                            Pantau infrastruktur master data cabang, unit batching plant ready-mix, dan hak akses personil lapangan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button asChild variant="outline" size="sm" className="h-9 border-slate-200 bg-white font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                            <Link href="/master/branches">Daftar Cabang</Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                            <Link href="/master/batching-plants/create">
                                <Plus className="size-4" /> Tambah Plant
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90"
                        >
                            {/* Top hairline accent */}
                            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-600 opacity-90 transition-all group-hover:h-1.5 dark:bg-emerald-500" />

                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            {card.label}
                                        </p>
                                        <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                            {card.codePrefix}
                                        </p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-300">
                                        <card.icon className="size-5" />
                                    </div>
                                </div>

                                <div className="mt-6 flex items-baseline gap-2">
                                    <span className="font-sans text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {card.value}
                                    </span>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        {card.badge}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                                <span>{card.unit}</span>
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
                                    Buka data <ArrowUpRight className="size-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom Section: Quick Actions & Operational Integrity */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Quick Master Actions */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                    Aksi Cepat Master Data
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Akses cepat untuk registrasi entitas baru ke sistem
                                </p>
                            </div>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                3 Modul Master
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Link
                                href="/master/branches/create"
                                className="group flex flex-col justify-between rounded-xl border border-slate-200/70 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-50/70 hover:shadow-xs dark:border-slate-800 dark:hover:bg-slate-800/50"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                                            Modul 01
                                        </span>
                                        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Tambah Cabang</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Registrasi wilayah kantor cabang & kode otomatis.</p>
                                </div>
                            </Link>

                            <Link
                                href="/master/batching-plants/create"
                                className="group flex flex-col justify-between rounded-xl border border-slate-200/70 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-50/70 hover:shadow-xs dark:border-slate-800 dark:hover:bg-slate-800/50"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                                            Modul 02
                                        </span>
                                        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Tambah Plant</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Daftarkan plant dan kapasitas m³ per hari.</p>
                                </div>
                            </Link>

                            <Link
                                href="/master/users/create"
                                className="group flex flex-col justify-between rounded-xl border border-slate-200/70 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-50/70 hover:shadow-xs dark:border-slate-800 dark:hover:bg-slate-800/50"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                                            Modul 03
                                        </span>
                                        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Tambah User</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Buat operator dan atur penugasan plant.</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Operational Integrity Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-900 p-6 text-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <h3 className="text-base font-bold tracking-tight text-white">Integritas Bisnis PKM</h3>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                Standar relasi entitas & aturan industri Tonasa Group
                            </p>

                            <div className="mt-4 space-y-2.5">
                                <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-xs text-slate-300">
                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong className="text-white">Kode Unik Permanen:</strong> Format kode bisnis digenerate otomatis dan tidak dapat diubah.
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-xs text-slate-300">
                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong className="text-white">Hierarki Wilayah:</strong> Penugasan batching plant terkunci pada cabang yang sama.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                            <span>Ready-Mix Production</span>
                            <span className="font-mono text-emerald-400">v1.0 Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};


