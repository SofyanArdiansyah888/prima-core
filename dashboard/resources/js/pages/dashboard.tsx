import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Factory,
    FileSpreadsheet,
    Package,
    Plus,
    Route,
    ShieldCheck,
    ShoppingCart,
    Truck,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DeliveryMap } from '@/components/map/delivery-map';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type Stats = {
    branches: number;
    plants: number;
    users: number;
    orders: number;
    workOrders: number;
    dispatches: number;
    products: number;
};

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lng: number;
    status: string;
    daily_capacity_m3: number | null;
};

type DeliveryItem = {
    id: number;
    surat_jalan_code?: string;
    surat_jalan_uuid?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string | null;
    status: string;
    dispatch_status?: string;
    delivery_sequence: number;
    customer_name: string;
    project_title: string | null;
    destination_address: string;
    lat: number;
    lng: number;
    product_name?: string;
    product_code?: string;
    quantity: number;
    unit: string;
    plant_name?: string;
    plant_lat?: number;
    plant_lng?: number;
};

export default function Dashboard({
    stats,
    plants,
    activeDeliveries,
}: {
    stats: Stats;
    plants: Plant[];
    activeDeliveries: DeliveryItem[];
}) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const primaryCards = [
        {
            label: 'Pesanan Pelanggan (SO)',
            codePrefix: 'SO-SULSEL-*',
            value: stats.orders,
            href: '/sales/orders',
            icon: ShoppingCart,
            unit: 'Total pesanan aktif & ritase',
            badge: 'Sales Orders',
            borderAccent: 'border-l-emerald-600',
        },
        {
            label: 'Work Orders (SPK)',
            codePrefix: 'WO-BP*-*',
            value: stats.workOrders,
            href: '/production/work-orders',
            icon: FileSpreadsheet,
            unit: 'Perintah kerja produksi',
            badge: 'Batching Schedule',
            borderAccent: 'border-l-purple-600',
        },
        {
            label: 'Surat Jalan & Pengantaran',
            codePrefix: 'SJ-BP*-*',
            value: stats.dispatches,
            href: '/dispatch/surat-jalan',
            icon: Truck,
            unit: 'Ritase armada & timbangan',
            badge: 'Armada Aktif',
            borderAccent: 'border-l-blue-600',
        },
        {
            label: 'Batching Plant Tonasa',
            codePrefix: 'BR-*-BP-NN',
            value: stats.plants,
            href: '/master/batching-plants',
            icon: Factory,
            unit: 'Unit produksi ready-mix',
            badge: 'Siap Operasi',
            borderAccent: 'border-l-teal-600',
        },
    ];

    return (
        <>
            <Head title="Dashboard Operasional" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
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
                            Dashboard Operasional
                        </h1>
                        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                            Ringkasan pesanan pelanggan, status SPK batching plant, dan riwayat surat jalan pengantaran.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button asChild size="sm" className="h-9 bg-purple-700 font-medium text-white shadow-xs hover:bg-purple-800 dark:bg-purple-600">
                            <Link href="/production/work-orders/create">
                                <Plus className="size-4" /> Terbitkan SPK
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 bg-emerald-700 font-medium text-white shadow-xs hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                            <Link href="/dispatch/surat-jalan/create">
                                <Plus className="size-4" /> Buat Surat Jalan
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {primaryCards.map((card) => (
                        <Link
                            key={card.label}
                            href={card.href}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 border-l-4 ${card.borderAccent}`}
                        >
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            {card.label}
                                        </p>
                                        <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                            {card.codePrefix}
                                        </p>
                                    </div>
                                    <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                        <card.icon className="size-4" />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="font-sans text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {card.value}
                                    </span>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        {card.badge}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                                <span className="text-[11px]">{card.unit}</span>
                                <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Map Section */}
                <DeliveryMap plants={plants} deliveries={activeDeliveries} />

                {/* Quick Master Shortcuts */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <Link
                        href="/sales/orders/create"
                        className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900"
                    >
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Aksi 01</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Pesan Material Baru</h3>
                        <p className="text-xs text-slate-500 mt-1">Input pesanan customer & auto-detect plant terdekat.</p>
                    </Link>

                    <Link
                        href="/master/products"
                        className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900"
                    >
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Master Data</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Katalog Mutu Produk</h3>
                        <p className="text-xs text-slate-500 mt-1">{stats.products} produk ready mix & semen aktif.</p>
                    </Link>

                    <Link
                        href="/master/delivery-rates"
                        className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900"
                    >
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Logistik</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Tarif Pengantaran Plant</h3>
                        <p className="text-xs text-slate-500 mt-1">Konfigurasi ongkir per radius kilometer.</p>
                    </Link>

                    <Link
                        href="/master/branches"
                        className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-500/50 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900"
                    >
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Wilayah</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Cabang & Personil</h3>
                        <p className="text-xs text-slate-500 mt-1">{stats.branches} cabang · {stats.users} operator terdaftar.</p>
                    </Link>
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
