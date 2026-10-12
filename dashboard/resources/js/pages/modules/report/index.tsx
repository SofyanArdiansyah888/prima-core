import { Head, router } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';

type Kind = 'sales' | 'production' | 'dispatch';

const PATHS: Record<Kind, string> = {
    sales: '/laporan/penjualan',
    production: '/laporan/produksi',
    dispatch: '/laporan/distribusi',
};

export default function ReportIndex({
    kind,
    title,
    filters,
    plants,
    metrics,
    headings,
    rows,
}: {
    kind: Kind;
    title: string;
    filters: { from: string; to: string; batching_plant_id: string };
    plants: { id: number; code: string; name: string }[];
    metrics: { label: string; value: string }[];
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

    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="inline-flex items-center rounded-md border border-[#ea580c]/20 bg-[#ea580c]/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">
                            Laporan
                        </span>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                            <a href={`${PATHS[kind]}/excel?${query}`}>
                                <Download className="size-4" /> Excel
                            </a>
                        </Button>
                        <Button asChild size="sm" className="bg-[#0c1d37] text-white hover:bg-[#162e55]">
                            <a href={`${PATHS[kind]}/pdf?${query}`}>
                                <FileText className="size-4" /> PDF
                            </a>
                        </Button>
                    </div>
                </div>

                <form
                    className="grid gap-3 rounded-xl border border-slate-200/80 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(PATHS[kind], { from, to, batching_plant_id: plantId }, { preserveState: true });
                    }}
                >
                    <div>
                        <Label htmlFor="from">Dari</Label>
                        <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                        <Label htmlFor="to">Sampai</Label>
                        <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                        <Label htmlFor="plant">Plant</Label>
                        <select
                            id="plant"
                            value={plantId}
                            onChange={(e) => setPlantId(e.target.value)}
                            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Semua plant</option>
                            {plants.map((plant) => (
                                <option key={plant.id} value={plant.id}>
                                    {plant.name} ({plant.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" className="bg-[#0c1d37] text-white hover:bg-[#162e55]">Tampilkan</Button>
                    </div>
                </form>

                <div className="grid gap-3 sm:grid-cols-3">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{metric.label}</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    {headings.map((heading) => (
                                        <th key={heading} className="px-4 py-3">{heading}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={headings.length} className="px-4 py-8 text-center text-slate-500">
                                            Tidak ada data pada periode ini.
                                        </td>
                                    </tr>
                                )}
                                {rows.map((row, index) => (
                                    <tr key={index} className="border-b last:border-0">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-2.5">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

ReportIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Laporan', href: '/laporan/penjualan' },
    ],
};
