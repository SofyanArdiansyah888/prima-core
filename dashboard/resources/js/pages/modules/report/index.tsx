import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Building2,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    Package,
    RotateCcw,
    ShoppingCart,
    TrendingUp,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';

type Kind = 'sales' | 'production' | 'dispatch';

const PATHS: Record<Kind, string> = {
    sales: '/laporan/penjualan',
    production: '/laporan/produksi',
    dispatch: '/laporan/distribusi',
};

const TAB_CONFIG: { id: Kind; label: string; icon: typeof ShoppingCart }[] = [
    { id: 'sales', label: 'Pesanan & Penjualan', icon: ShoppingCart },
    { id: 'production', label: 'Produksi Batching (SPK)', icon: FileSpreadsheet },
    { id: 'dispatch', label: 'Distribusi & Ritase Armada', icon: Truck },
];

export default function ReportIndex({
    kind,
    title,
    periodLabel,
    filters,
    plants,
    metrics,
    records = [],
    headings,
    rows,
}: {
    kind: Kind;
    title: string;
    periodLabel?: string;
    filters: { from: string; to: string; batching_plant_id: string };
    plants: { id: number; code: string; name: string }[];
    metrics: { label: string; value: string; desc?: string }[];
    records?: any[];
    headings: string[];
    rows: (string | number)[][];
}) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [plantId, setPlantId] = useState(filters.batching_plant_id);

    const query = new URLSearchParams({
        from,
        to,
        ...(plantId ? { batching_plant_id: plantId } : {}),
    }).toString();

    const applyFilter = (newFrom = from, newTo = to, newPlantId = plantId) => {
        router.get(PATHS[kind], { from: newFrom, to: newTo, batching_plant_id: newPlantId }, { preserveState: true });
    };

    const handleTabChange = (newKind: Kind) => {
        router.get(PATHS[newKind], { from, to, batching_plant_id: plantId }, { preserveState: true });
    };

    const setQuickPreset = (preset: 'today' | '7days' | 'month' | 'last_month' | 'year') => {
        const today = new Date();
        const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'today':
                start = today;
                end = today;
                break;
            case '7days':
                start = new Date();
                start.setDate(today.getDate() - 6);
                end = today;
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                end = today;
                break;
        }

        const startStr = formatDateStr(start);
        const endStr = formatDateStr(end);
        setFrom(startStr);
        setTo(endStr);
        applyFilter(startStr, endStr, plantId);
    };

    const resetFilter = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        setFrom(firstDay);
        setTo(todayStr);
        setPlantId('');
        applyFilter(firstDay, todayStr, '');
    };

    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-[#ea580c]/20 bg-[#ea580c]/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                                Laporan Operasional Tonasa PKM
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            {title}
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Periode Analisis: <span className="font-semibold text-slate-700 dark:text-slate-300">{periodLabel || `${filters.from} s/d ${filters.to}`}</span>
                        </p>
                    </div>

                    {/* Export CTAs */}
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40">
                            <a href={`${PATHS[kind]}/excel?${query}`}>
                                <Download className="size-3.5 text-emerald-600" /> Unduh Excel (.xlsx)
                            </a>
                        </Button>
                        <Button asChild size="sm" className="h-9 gap-1.5 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-3.5 text-xs font-bold text-white shadow-md shadow-[#0c1d37]/15">
                            <a href={`${PATHS[kind]}/pdf?${query}`} target="_blank" rel="noreferrer">
                                <FileText className="size-3.5 text-amber-400" /> Cetak PDF Resmi
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Segmented Navigation Tabs */}
                <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 dark:border-slate-800 dark:bg-slate-900/60">
                    {TAB_CONFIG.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = kind === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-white text-[#0c1d37] shadow-sm dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <Icon className={`size-4 ${isActive ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter Toolbar with Quick Presets */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Quick Preset Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                            <CalendarDays className="size-3.5" /> Rentang Cepat:
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPreset('today')}
                            className="h-7 rounded-lg px-2.5 text-xs font-semibold bg-slate-100/70 hover:bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Hari Ini
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPreset('7days')}
                            className="h-7 rounded-lg px-2.5 text-xs font-semibold bg-slate-100/70 hover:bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            7 Hari Terakhir
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPreset('month')}
                            className="h-7 rounded-lg px-2.5 text-xs font-semibold bg-slate-100/70 hover:bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Bulan Ini
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPreset('last_month')}
                            className="h-7 rounded-lg px-2.5 text-xs font-semibold bg-slate-100/70 hover:bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Bulan Lalu
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPreset('year')}
                            className="h-7 rounded-lg px-2.5 text-xs font-semibold bg-slate-100/70 hover:bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Tahun Ini
                        </Button>
                    </div>

                    {/* Filter Inputs Form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter();
                        }}
                        className="grid gap-4 pt-4 sm:grid-cols-12 items-end"
                    >
                        <div className="sm:col-span-3">
                            <Label htmlFor="from" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Dari Tanggal
                            </Label>
                            <Input
                                id="from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1.5 h-9.5 rounded-xl border-slate-200 bg-slate-50/70 font-mono text-xs focus:bg-white dark:border-slate-800 dark:bg-slate-800"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <Label htmlFor="to" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Sampai Tanggal
                            </Label>
                            <Input
                                id="to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-1.5 h-9.5 rounded-xl border-slate-200 bg-slate-50/70 font-mono text-xs focus:bg-white dark:border-slate-800 dark:bg-slate-800"
                            />
                        </div>

                        <div className="sm:col-span-4">
                            <Label htmlFor="plant" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Unit Batching Plant
                            </Label>
                            <select
                                id="plant"
                                value={plantId}
                                onChange={(e) => setPlantId(e.target.value)}
                                className="mt-1.5 w-full h-9.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="">Semua Batching Plant (Seluruh Cabang)</option>
                                {plants.map((plant) => (
                                    <option key={plant.id} value={plant.id}>
                                        {plant.name} ({plant.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2">
                            <Button
                                type="submit"
                                className="h-9.5 flex-1 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] text-xs font-bold text-white shadow-xs"
                            >
                                <Filter className="size-3.5 mr-1" /> Terapkan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                                title="Reset filter ke bulan berjalan"
                                className="h-9.5 rounded-xl border-slate-200 px-3 hover:bg-slate-100"
                            >
                                <RotateCcw className="size-3.5 text-slate-500" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* KPI Ribbon (4 Metric Cards) */}
                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                    {metrics.map((metric, idx) => {
                        const tones = [
                            'border-[#0c1d37]/20 bg-gradient-to-br from-slate-50 to-white text-[#0c1d37]',
                            'border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white text-emerald-800',
                            'border-blue-200/80 bg-gradient-to-br from-blue-50/50 to-white text-blue-800',
                            'border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white text-amber-800',
                        ];
                        const icons = [Activity, CheckCircle2, TrendingUp, Package];
                        const Icon = icons[idx % icons.length];

                        return (
                            <div
                                key={metric.label}
                                className={`rounded-2xl border p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${tones[idx % tones.length]}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {metric.label}
                                    </span>
                                    <Icon className="size-4 opacity-70" />
                                </div>
                                <p className="mt-1.5 font-mono text-xl font-extrabold tracking-tight dark:text-white">
                                    {metric.value}
                                </p>
                                {metric.desc && (
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {metric.desc}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Interactive Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        {kind === 'sales' && (
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5">Kode Pesanan</th>
                                        <th className="px-4 py-3.5">Waktu Transaksi</th>
                                        <th className="px-4 py-3.5">Pelanggan & Proyek</th>
                                        <th className="px-4 py-3.5">Batching Plant</th>
                                        <th className="px-4 py-3.5 text-center">Status Pesanan</th>
                                        <th className="px-4 py-3.5 text-center">Pembayaran</th>
                                        <th className="px-4 py-3.5 text-right">Nilai Total</th>
                                        <th className="px-4 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                Tidak ada data pesanan penjualan yang ditemukan pada rentang tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-mono font-bold text-[#0c1d37] dark:text-white">
                                                    <Link href={`/sales/orders/${r.uuid}`} className="hover:underline flex items-center gap-1">
                                                        <span>{r.code}</span>
                                                        <ArrowUpRight className="size-3 text-slate-400" />
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.formatted_date}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{r.formatted_time}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{r.customer_name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{r.project_title}</p>
                                                    {r.item_names && (
                                                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-xs">{r.item_names}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.plant_name}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{r.plant_code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        r.status === 'COMPLETED'
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                            : r.status === 'CANCELLED'
                                                            ? 'bg-red-500/10 text-[#d91424] dark:text-red-300'
                                                            : r.status === 'ON_DELIVERY'
                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                    }`}>
                                                        {r.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                                        r.payment_status === 'PAID'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                                    }`}>
                                                        {r.payment_status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(r.total_price)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                                                        <Link href={`/sales/orders/${r.uuid}`}>
                                                            <Eye className="size-3.5 mr-1 text-slate-500" /> Detail
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {kind === 'production' && (
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5">Kode SPK</th>
                                        <th className="px-4 py-3.5">Jadwal & Slot</th>
                                        <th className="px-4 py-3.5">Pelanggan / Proyek</th>
                                        <th className="px-4 py-3.5">Mutu Beton & Formula</th>
                                        <th className="px-4 py-3.5">Batching Plant</th>
                                        <th className="px-4 py-3.5 text-center min-w-[180px]">Realisasi Pengiriman</th>
                                        <th className="px-4 py-3.5 text-center">Status Pemenuhan</th>
                                        <th className="px-4 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                Tidak ada data SPK produksi yang ditemukan pada rentang tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                                                    <Link href={`/production/work-orders/${r.uuid}`} className="hover:underline flex items-center gap-1">
                                                        <span>{r.code}</span>
                                                        <ArrowUpRight className="size-3 text-slate-400" />
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.formatted_date}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{r.time_slot}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{r.customer_name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{r.project_title}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900 dark:text-white">{r.product_name}</p>
                                                    <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-mono text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                        {r.recipe_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.plant_name}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{r.plant_code}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                                                        <span>{formatNumber(r.dispatched_quantity)} / {formatNumber(r.target_quantity)} {r.unit}</span>
                                                        <span className="text-slate-500">{r.progress_percent}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden dark:bg-slate-800">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                r.progress_percent >= 100 ? 'bg-emerald-600' : 'bg-[#ea580c]'
                                                            }`}
                                                            style={{ width: `${r.progress_percent}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        r.progress_percent >= 100
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                            : r.dispatched_quantity > 0
                                                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                        {r.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                                                        <Link href={`/production/work-orders/${r.uuid}`}>
                                                            <Eye className="size-3.5 mr-1 text-slate-500" /> Detail
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {kind === 'dispatch' && (
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5">Kode Surat Jalan</th>
                                        <th className="px-4 py-3.5">Waktu Berangkat</th>
                                        <th className="px-4 py-3.5">Armada & Driver</th>
                                        <th className="px-4 py-3.5">Tujuan Proyek</th>
                                        <th className="px-4 py-3.5">Batching Plant</th>
                                        <th className="px-4 py-3.5 text-right">Muatan Terkirim</th>
                                        <th className="px-4 py-3.5 text-center">Status Pengantaran</th>
                                        <th className="px-4 py-3.5">Penerima Lapangan</th>
                                        <th className="px-4 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                                Tidak ada data Surat Jalan distribusi yang ditemukan pada rentang tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                                                    <Link href={`/dispatch/surat-jalan/${r.uuid}`} className="hover:underline flex items-center gap-1">
                                                        <span>{r.code}</span>
                                                        <ArrowUpRight className="size-3 text-slate-400" />
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.formatted_date}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{r.formatted_time}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{r.vehicle_number}</p>
                                                    <p className="text-[11px] text-slate-500">Sopir: {r.driver_name}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{r.customer_name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{r.project_title}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.plant_name}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{r.plant_code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatNumber(r.quantity_delivered)} {r.unit}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        r.status === 'COMPLETED'
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                            : r.status === 'CANCELLED'
                                                            ? 'bg-red-500/10 text-[#d91424] dark:text-red-300'
                                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                        {r.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                    {r.recipient_name ? (
                                                        <div>
                                                            <span className="font-medium text-emerald-800 dark:text-emerald-300 block">✓ {r.recipient_name}</span>
                                                            {r.received_at && (
                                                                <span className="text-[10px] text-slate-400">{r.received_at}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Belum diserahterimakan</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                                                        <Link href={`/dispatch/surat-jalan/${r.uuid}`}>
                                                            <Eye className="size-3.5 mr-1 text-slate-500" /> Detail
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Table Footer Summary */}
                    {records.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                            <span>
                                Menampilkan <strong>{records.length}</strong> entri data pada periode terpilih
                            </span>
                            <span className="font-medium">
                                PT Prima Karya Manunggal — Semen Tonasa
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ReportIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Laporan & Rekapitulasi', href: '/laporan/penjualan' },
    ],
};
