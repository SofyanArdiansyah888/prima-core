import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
    Progress,
    StatusChips,
    Td,
    Th,
} from '@/components/list-page';
import type { Tone } from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';

type WorkOrderRow = {
    id: number;
    uuid: string;
    code: string;
    scheduled_date: string;
    scheduled_time_slot: string | null;
    target_quantity: number;
    dispatched_quantity: number;
    unit: string;
    status: string;
    order: {
        code: string;
        customer_name: string;
        project_title: string;
    } | null;
    product?: { name: string; code: string } | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
    SCHEDULED: { label: 'Terjadwal', tone: 'slate' },
    IN_PRODUCTION: { label: 'Produksi', tone: 'amber' },
    READY_FOR_DISPATCH: { label: 'Siap Kirim', tone: 'blue' },
    COMPLETED: { label: 'Selesai', tone: 'emerald' },
    CANCELLED: { label: 'Dibatalkan', tone: 'red' },
};

export default function WorkOrderIndex({
    workOrders,
    counts = {},
    plants = [],
    statuses = [],
    filters = {},
}: {
    workOrders: Paginated<WorkOrderRow>;
    counts?: Record<string, number>;
    plants?: { id: number; code: string; name: string }[];
    statuses?: { value: string; label: string }[];
    filters?: { search?: string; status?: string; batching_plant_id?: string };
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
            '/production/work-orders',
            { search, status, batching_plant_id: plantId, ...params },
            { preserveState: true },
        );

    const totalAll = Object.values(counts).reduce((a, b) => a + Number(b), 0);

    return (
        <>
            <Head title="Work Orders (SPK)" />
            <ListPage>
                <ListHeader
                    title="Work Orders (SPK)"
                    subtitle="Jadwal produksi batching dan progres pengirimannya."
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="h-9 rounded-lg bg-[#0c1d37] text-xs font-semibold text-white hover:bg-[#162e55]"
                        >
                            <Link href="/production/work-orders/create">
                                <Plus className="mr-1 size-4" /> Terbitkan SPK
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
                    placeholder="Cari no. SPK, no. pesanan, pelanggan…"
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
                            <Th>No. SPK</Th>
                            <Th>Pelanggan</Th>
                            <Th>Produk</Th>
                            <Th>Jadwal</Th>
                            <Th>Progres Kirim</Th>
                            <Th align="center">Status</Th>
                        </tr>
                    }
                    footer={
                        <Pagination
                            links={workOrders.links}
                            total={workOrders.total}
                            shown={workOrders.data.length}
                        />
                    }
                >
                    {workOrders.data.length === 0 ? (
                        <EmptyRow
                            colSpan={6}
                            message="Belum ada SPK yang sesuai filter."
                        />
                    ) : (
                        workOrders.data.map((wo) => {
                            const st = STATUS[wo.status] ?? {
                                label: wo.status,
                                tone: 'slate' as Tone,
                            };

                            return (
                                <tr
                                    key={wo.uuid}
                                    onClick={() =>
                                        router.visit(
                                            `/production/work-orders/${wo.uuid}`,
                                        )
                                    }
                                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="whitespace-nowrap">
                                        <p className="font-mono font-bold text-[#0c1d37] dark:text-slate-100">
                                            {wo.code}
                                        </p>
                                        <p className="font-mono text-[11px] text-slate-400">
                                            {wo.order?.code}
                                        </p>
                                    </Td>
                                    <Td className="max-w-[240px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {wo.order?.customer_name ?? '—'}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {wo.order?.project_title}
                                        </p>
                                    </Td>
                                    <Td className="max-w-[200px]">
                                        <p className="truncate text-slate-800 dark:text-slate-200">
                                            {wo.product?.name ?? '—'}
                                        </p>
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        <p className="text-slate-800 dark:text-slate-200">
                                            {formatDate(wo.scheduled_date)}
                                        </p>
                                        {wo.scheduled_time_slot && (
                                            <p className="text-[11px] text-slate-400">
                                                {wo.scheduled_time_slot}
                                            </p>
                                        )}
                                    </Td>
                                    <Td>
                                        <Progress
                                            done={Number(
                                                wo.dispatched_quantity,
                                            )}
                                            total={Number(wo.target_quantity)}
                                            unit={wo.unit}
                                        />
                                    </Td>
                                    <Td align="center">
                                        <Badge tone={st.tone}>{st.label}</Badge>
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

WorkOrderIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Work Orders (SPK)', href: '/production/work-orders' },
    ],
};
