import { Head, router } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    EmptyRow,
    FilterSelect,
    ListHeader,
    ListPage,
    ListTable,
    Progress,
    Td,
    Th,
} from '@/components/list-page';
import type { Tone } from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';

type Kind = 'sales' | 'production' | 'dispatch';

const PATHS: Record<Kind, string> = {
    sales: '/laporan/penjualan',
    production: '/laporan/produksi',
    dispatch: '/laporan/distribusi',
};

const TABS: { id: Kind; label: string }[] = [
    { id: 'sales', label: 'Penjualan' },
    { id: 'production', label: 'Produksi' },
    { id: 'dispatch', label: 'Distribusi' },
];

type Preset = '' | 'today' | '7days' | 'month' | 'last_month' | 'year';

function presetRange(preset: Exclude<Preset, ''>): [string, string] {
    const today = new Date();
    const fmt = (d: Date) => {
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

        return local.toISOString().split('T')[0];
    };

    switch (preset) {
        case 'today':
            return [fmt(today), fmt(today)];
        case '7days': {
            const s = new Date(today);
            s.setDate(today.getDate() - 6);

            return [fmt(s), fmt(today)];
        }
        case 'month':
            return [
                fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
                fmt(today),
            ];
        case 'last_month':
            return [
                fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
            ];
        case 'year':
            return [fmt(new Date(today.getFullYear(), 0, 1)), fmt(today)];
    }
}

function orderTone(status: string): Tone {
    if (status === 'COMPLETED') {
        return 'emerald';
    }

    if (status === 'CANCELLED') {
        return 'red';
    }

    if (status === 'ON_DELIVERY' || status === 'PROCESSING') {
        return 'purple';
    }

    if (status === 'PENDING_APPROVAL') {
        return 'amber';
    }

    return 'blue';
}

function sjTone(status: string): Tone {
    if (status === 'COMPLETED') {
        return 'emerald';
    }

    if (status === 'CANCELLED' || status === 'RETURNED') {
        return 'red';
    }

    return 'amber';
}

export default function ReportIndex({
    kind,
    title,
    periodLabel,
    filters,
    plants,
    metrics,
    records = [],
}: {
    kind: Kind;
    title: string;
    periodLabel?: string;
    filters: { from: string; to: string; batching_plant_id: string };
    plants: { id: number; code: string; name: string }[];
    metrics: { label: string; value: string; desc?: string }[];

    records?: any[];
    headings?: string[];
    rows?: (string | number)[][];
}) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const plantId = filters.batching_plant_id ?? '';

    const go = (
        params: { from?: string; to?: string; batching_plant_id?: string },
        target: Kind = kind,
    ) =>
        router.get(
            PATHS[target],
            { from, to, batching_plant_id: plantId, ...params },
            { preserveState: true },
        );

    const query = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        ...(plantId ? { batching_plant_id: plantId } : {}),
    }).toString();

    const applyPreset = (preset: Preset) => {
        if (!preset) {
            return;
        }

        const [f, t] = presetRange(preset);
        setFrom(f);
        setTo(t);
        go({ from: f, to: t });
    };

    return (
        <>
            <Head title={title} />
            <ListPage>
                <ListHeader
                    title="Laporan"
                    subtitle={`Periode ${periodLabel || `${filters.from} s/d ${filters.to}`}`}
                    actions={
                        <>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-lg text-xs font-semibold"
                            >
                                <a href={`${PATHS[kind]}/excel?${query}`}>
                                    <Download className="mr-1 size-3.5" /> Excel
                                </a>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className="h-9 rounded-lg bg-[#0c1d37] text-xs font-semibold text-white hover:bg-[#162e55]"
                            >
                                <a
                                    href={`${PATHS[kind]}/pdf?${query}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FileText className="mr-1 size-3.5" /> PDF
                                </a>
                            </Button>
                        </>
                    }
                />

                {/* Tab jenis laporan */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => go({}, tab.id)}
                            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                                kind === tab.id
                                    ? 'border-[#ea580c] text-[#0c1d37] dark:text-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter dalam satu baris */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({});
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <FilterSelect
                        value=""
                        onChange={(v) => applyPreset(v as Preset)}
                    >
                        <option value="">Rentang cepat…</option>
                        <option value="today">Hari ini</option>
                        <option value="7days">7 hari terakhir</option>
                        <option value="month">Bulan ini</option>
                        <option value="last_month">Bulan lalu</option>
                        <option value="year">Tahun ini</option>
                    </FilterSelect>
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="h-9 w-auto rounded-lg text-xs"
                    />
                    <span className="text-xs text-slate-400">s/d</span>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="h-9 w-auto rounded-lg text-xs"
                    />
                    <FilterSelect
                        value={plantId}
                        onChange={(v) => go({ batching_plant_id: v })}
                    >
                        <option value="">Semua plant</option>
                        {plants.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </FilterSelect>
                    <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        className="h-9 rounded-lg text-xs font-semibold"
                    >
                        Terapkan
                    </Button>
                </form>

                {/* Ringkasan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {metrics.map((m) => (
                        <div
                            key={m.label}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="text-[11px] font-medium text-slate-500">
                                {m.label}
                            </p>
                            <p className="mt-0.5 font-mono text-lg font-bold text-slate-900 dark:text-white">
                                {m.value}
                            </p>
                        </div>
                    ))}
                </div>

                {kind === 'sales' && (
                    <ListTable
                        head={
                            <tr>
                                <Th>No. Pesanan</Th>
                                <Th>Tanggal</Th>
                                <Th>Pelanggan</Th>
                                <Th align="center">Status</Th>
                                <Th align="center">Pembayaran</Th>
                                <Th align="right">Total</Th>
                            </tr>
                        }
                        footer={<Footer count={records.length} />}
                    >
                        {records.length === 0 ? (
                            <EmptyRow
                                colSpan={6}
                                message="Tidak ada pesanan pada periode ini."
                            />
                        ) : (
                            records.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() =>
                                        router.visit(`/sales/orders/${r.uuid}`)
                                    }
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="font-mono font-bold whitespace-nowrap text-[#0c1d37] dark:text-slate-100">
                                        {r.code}
                                    </Td>
                                    <Td className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                                        {r.formatted_date}
                                    </Td>
                                    <Td className="max-w-[260px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {r.customer_name}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {r.project_title}
                                        </p>
                                    </Td>
                                    <Td align="center">
                                        <Badge tone={orderTone(r.status)}>
                                            {r.status_label}
                                        </Badge>
                                    </Td>
                                    <Td align="center">
                                        <Badge
                                            tone={
                                                r.payment_status === 'PAID'
                                                    ? 'emerald'
                                                    : 'amber'
                                            }
                                        >
                                            {r.payment_status_label}
                                        </Badge>
                                    </Td>
                                    <Td
                                        align="right"
                                        className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                    >
                                        {formatCurrency(r.total_price)}
                                    </Td>
                                </tr>
                            ))
                        )}
                    </ListTable>
                )}

                {kind === 'production' && (
                    <ListTable
                        head={
                            <tr>
                                <Th>No. SPK</Th>
                                <Th>Jadwal</Th>
                                <Th>Pelanggan</Th>
                                <Th>Produk</Th>
                                <Th>Realisasi Kirim</Th>
                            </tr>
                        }
                        footer={<Footer count={records.length} />}
                    >
                        {records.length === 0 ? (
                            <EmptyRow
                                colSpan={5}
                                message="Tidak ada SPK pada periode ini."
                            />
                        ) : (
                            records.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() =>
                                        router.visit(
                                            `/production/work-orders/${r.uuid}`,
                                        )
                                    }
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="font-mono font-bold whitespace-nowrap text-[#0c1d37] dark:text-slate-100">
                                        {r.code}
                                    </Td>
                                    <Td className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                                        {r.formatted_date}
                                    </Td>
                                    <Td className="max-w-[240px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {r.customer_name}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {r.project_title}
                                        </p>
                                    </Td>
                                    <Td className="max-w-[200px] truncate text-slate-800 dark:text-slate-200">
                                        {r.product_name}
                                    </Td>
                                    <Td>
                                        <Progress
                                            done={Number(r.dispatched_quantity)}
                                            total={Number(r.target_quantity)}
                                            unit={r.unit}
                                        />
                                    </Td>
                                </tr>
                            ))
                        )}
                    </ListTable>
                )}

                {kind === 'dispatch' && (
                    <ListTable
                        head={
                            <tr>
                                <Th>No. Surat Jalan</Th>
                                <Th>Berangkat</Th>
                                <Th>Tujuan</Th>
                                <Th>Armada</Th>
                                <Th align="right">Muatan</Th>
                                <Th align="center">Status</Th>
                            </tr>
                        }
                        footer={<Footer count={records.length} />}
                    >
                        {records.length === 0 ? (
                            <EmptyRow
                                colSpan={6}
                                message="Tidak ada surat jalan pada periode ini."
                            />
                        ) : (
                            records.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() =>
                                        router.visit(
                                            `/dispatch/surat-jalan/${r.uuid}`,
                                        )
                                    }
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="font-mono font-bold whitespace-nowrap text-[#0c1d37] dark:text-slate-100">
                                        {r.code}
                                    </Td>
                                    <Td className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                                        {r.formatted_date}
                                    </Td>
                                    <Td className="max-w-[240px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {r.customer_name}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {r.project_title}
                                        </p>
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                            {r.vehicle_number}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {r.driver_name}
                                        </p>
                                    </Td>
                                    <Td
                                        align="right"
                                        className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                    >
                                        {formatNumber(r.quantity_delivered)}{' '}
                                        {r.unit}
                                    </Td>
                                    <Td align="center">
                                        <Badge tone={sjTone(r.status)}>
                                            {r.status_label}
                                        </Badge>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </ListTable>
                )}
            </ListPage>
        </>
    );
}

function Footer({ count }: { count: number }) {
    return count > 0 ? (
        <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-800">
            {count} data
        </div>
    ) : null;
}

ReportIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Laporan', href: '/laporan/penjualan' },
    ],
};
