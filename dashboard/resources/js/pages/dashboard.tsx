import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, Factory, Users } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
            label: 'Cabang aktif',
            value: stats.branches,
            href: '/master/branches',
            icon: Building2,
        },
        {
            label: 'Batching plant aktif',
            value: stats.plants,
            href: '/master/batching-plants',
            icon: Factory,
        },
        {
            label: 'User aktif',
            value: stats.users,
            href: '/master/users',
            icon: Users,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-400">
                        PKM Operations
                    </p>
                    <h1 className="font-serif text-3xl tracking-tight text-stone-900 dark:text-stone-50">
                        Ringkasan operasional
                    </h1>
                    <p className="max-w-2xl text-sm text-stone-600 dark:text-stone-400">
                        Pantau cabang, batching plant, dan user yang terhubung ke jaringan ready-mix Semen Tonasa Group.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="group rounded-xl border border-stone-200 bg-stone-50 p-5 transition hover:border-emerald-800 dark:border-stone-800 dark:bg-stone-900"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-stone-500">{card.label}</p>
                                    <p className="mt-2 font-serif text-4xl text-stone-900 dark:text-stone-50">
                                        {card.value}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                    <card.icon className="size-3.5" />
                                </Badge>
                            </div>
                        </Link>
                    ))}
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
