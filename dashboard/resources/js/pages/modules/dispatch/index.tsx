import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Badge,
    EmptyRow,
    FilterSelect,
    ListHeader,
    ListPage,
    ListTable,
    ListToolbar,
    Pagination,
    StatusChips,
    Td,
    Th,
} from '@/components/list-page';
import type { Tone } from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { dashboard } from '@/routes';

type SuratJalanRow = {
    id: number;
    uuid: string;
    code: string;
    vehicle_number: string;
    driver_name: string;
    status: string;
    departure_time: string | null;
    created_at?: string;
    items?: {
        id: number;
        quantity_delivered: number;
        unit: string;
        destination_customer_name: string;
        destination_project_title: string | null;
    }[];
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
    ON_THE_WAY: { label: 'Dalam Perjalanan', tone: 'amber' },
    COMPLETED: { label: 'Diterima', tone: 'emerald' },
    CANCELLED: { label: 'Dibatalkan', tone: 'red' },
    // Status lama
    PREPARED: { label: 'Dalam Perjalanan', tone: 'amber' },
    DEPARTED: { label: 'Dalam Perjalanan', tone: 'amber' },
    ARRIVED: { label: 'Dalam Perjalanan', tone: 'amber' },
    UNLOADING: { label: 'Dalam Perjalanan', tone: 'amber' },
    RETURNED: { label: 'Dibatalkan', tone: 'red' },
};

export default function DispatchIndex({
    suratJalans,
    counts = {},
    plants,
    statuses,
    filters,
}: {
    suratJalans: Paginated<SuratJalanRow>;
    counts?: Record<string, number>;
    plants: { id: number; code: string; name: string }[];
    statuses: { value: string; label: string }[];
    filters: { search?: string; status?: string; batching_plant_id?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const status = filters.status ?? '';
    const plantId = filters.batching_plant_id ?? '';
    const flash = (
        usePage().props as { flash?: { success?: string; error?: string } }
    ).flash;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const go = (params: {
        search?: string;
        status?: string;
        batching_plant_id?: string;
    }) =>
        router.get(
            '/dispatch/surat-jalan',
            { search, status, batching_plant_id: plantId, ...params },
            { preserveState: true },
        );

    const totalAll = Object.values(counts).reduce((a, b) => a + Number(b), 0);

    return (
        <>
            <Head title="Surat Jalan & Pengantaran" />
            <ListPage>
                <ListHeader
                    title="Surat Jalan & Pengantaran"
                    subtitle="Ritase armada dari batching plant ke lokasi proyek."
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="h-9 rounded-lg bg-[#0c1d37] text-xs font-semibold text-white hover:bg-[#162e55]"
                        >
                            <Link href="/dispatch/surat-jalan/create">
                                <Plus className="mr-1 size-4" /> Terbitkan Surat
                                Jalan
                            </Link>
                        </Button>
                    }
                />

                <StatusChips
                    value={status}
                    onChange={(v) => go({ status: v })}
                    allCount={totalAll}
                    options={statuses.map((s) => ({
                        value: s.value,
                        label: STATUS[s.value]?.label ?? s.label,
                        count: Number(counts[s.value] ?? 0),
                    }))}
                />

                <ListToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onSubmit={() => go({})}
                    placeholder="Cari no. surat jalan, kendaraan, sopir, pelanggan…"
                >
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
                </ListToolbar>

                <ListTable
                    head={
                        <tr>
                            <Th>No. Surat Jalan</Th>
                            <Th>Tujuan</Th>
                            <Th>Armada</Th>
                            <Th align="right">Muatan</Th>
                            <Th align="center">Status</Th>
                            <Th align="right"> </Th>
                        </tr>
                    }
                    footer={
                        <Pagination
                            links={suratJalans.links}
                            total={suratJalans.total}
                            shown={suratJalans.data.length}
                        />
                    }
                >
                    {suratJalans.data.length === 0 ? (
                        <EmptyRow
                            colSpan={6}
                            message="Belum ada surat jalan yang sesuai filter."
                        />
                    ) : (
                        suratJalans.data.map((sj) => {
                            const st = STATUS[sj.status] ?? {
                                label: sj.status,
                                tone: 'slate' as Tone,
                            };
                            const items = sj.items ?? [];
                            const first = items[0];
                            const qty = items.reduce(
                                (sum, i) =>
                                    sum + Number(i.quantity_delivered || 0),
                                0,
                            );
                            const unit = first?.unit ?? '';

                            return (
                                <tr
                                    key={sj.uuid}
                                    onClick={() =>
                                        router.visit(
                                            `/dispatch/surat-jalan/${sj.uuid}`,
                                        )
                                    }
                                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="whitespace-nowrap">
                                        <p className="font-mono font-bold text-[#0c1d37] dark:text-slate-100">
                                            {sj.code}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {formatDateTime(
                                                sj.departure_time ??
                                                    sj.created_at ??
                                                    null,
                                            )}
                                        </p>
                                    </Td>
                                    <Td className="max-w-[260px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {first?.destination_customer_name ??
                                                '—'}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {items.length > 1
                                                ? `+${items.length - 1} tujuan lain`
                                                : first?.destination_project_title}
                                        </p>
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                            {sj.vehicle_number}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {sj.driver_name}
                                        </p>
                                    </Td>
                                    <Td
                                        align="right"
                                        className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                    >
                                        {qty.toLocaleString('id-ID', {
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        {unit}
                                    </Td>
                                    <Td align="center">
                                        <Badge tone={st.tone}>{st.label}</Badge>
                                    </Td>
                                    <Td align="right">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 rounded-md px-2 text-xs text-slate-600"
                                        >
                                            <a
                                                href={`/dispatch/surat-jalan/${sj.uuid}/print`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                title="Cetak surat jalan"
                                            >
                                                <Printer className="size-3.5" />
                                            </a>
                                        </Button>
                                    </Td>
                                </tr>
                            );
                        })
                    )}
                </ListTable>
            </ListPage>
        </>
    );
}

DispatchIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Surat Jalan & Pengantaran', href: '/dispatch/surat-jalan' },
    ],
};
