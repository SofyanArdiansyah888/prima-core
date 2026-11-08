import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileSpreadsheet, MapPin } from 'lucide-react';
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

type OrderRow = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    project_title: string;
    total_price: number;
    payment_status: string;
    status: string;
    created_at: string;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
    PENDING_APPROVAL: { label: 'Verifikasi Lokasi', tone: 'amber' },
    CONFIRMED: { label: 'Disetujui', tone: 'blue' },
    PROCESSING: { label: 'Diproses', tone: 'purple' },
    ON_DELIVERY: { label: 'Dikirim', tone: 'purple' },
    COMPLETED: { label: 'Selesai', tone: 'emerald' },
    CANCELLED: { label: 'Dibatalkan', tone: 'red' },
};

const CHIP_LABELS: Record<string, string> = {
    PENDING_APPROVAL: 'Verifikasi',
    CONFIRMED: 'Disetujui',
    PROCESSING: 'Diproses',
    ON_DELIVERY: 'Dikirim',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
};

function paymentBadge(o: OrderRow) {
    if (o.status === 'PENDING_APPROVAL' || o.status === 'CANCELLED') {
        return <span className="text-[11px] text-slate-400">—</span>;
    }

    if (o.payment_status === 'PAID' || o.payment_status === 'APPROVED_CREDIT') {
        return (
            <Badge tone="emerald">
                {o.payment_status === 'PAID' ? 'Lunas' : 'Kredit'}
            </Badge>
        );
    }

    if (o.payment_status === 'REFUNDED') {
        return <Badge tone="slate">Refund</Badge>;
    }

    return <Badge tone="amber">Belum bayar</Badge>;
}

export default function OrderIndex({
    orders,
    counts = {},
    plants,
    statuses,
    filters,
}: {
    orders: Paginated<OrderRow>;
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
            '/sales/orders',
            { search, status, batching_plant_id: plantId, ...params },
            { preserveState: true },
        );

    const totalAll = Object.values(counts).reduce((a, b) => a + Number(b), 0);

    return (
        <>
            <Head title="Pesanan Pelanggan" />
            <ListPage>
                <ListHeader
                    title="Pesanan Pelanggan"
                    subtitle="Pesanan masuk dari aplikasi mobile pelanggan."
                />

                <StatusChips
                    value={status}
                    onChange={(v) => go({ status: v })}
                    allCount={totalAll}
                    options={statuses.map((s) => ({
                        value: s.value,
                        label: CHIP_LABELS[s.value] ?? s.label,
                        count: Number(counts[s.value] ?? 0),
                    }))}
                />

                <ListToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onSubmit={() => go({})}
                    placeholder="Cari no. pesanan, pelanggan, proyek…"
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
                            <Th>No. Pesanan</Th>
                            <Th>Pelanggan</Th>
                            <Th align="right">Total</Th>
                            <Th align="center">Pembayaran</Th>
                            <Th align="center">Status</Th>
                            <Th align="right"> </Th>
                        </tr>
                    }
                    footer={
                        <Pagination
                            links={orders.links}
                            total={orders.total}
                            shown={orders.data.length}
                        />
                    }
                >
                    {orders.data.length === 0 ? (
                        <EmptyRow
                            colSpan={6}
                            message="Tidak ada pesanan yang sesuai filter."
                        />
                    ) : (
                        orders.data.map((o) => {
                            const st = STATUS[o.status] ?? {
                                label: o.status,
                                tone: 'slate' as Tone,
                            };
                            const canSpk =
                                o.status === 'CONFIRMED' &&
                                (o.payment_status === 'PAID' ||
                                    o.payment_status === 'APPROVED_CREDIT');

                            return (
                                <tr
                                    key={o.uuid}
                                    onClick={() =>
                                        router.visit(`/sales/orders/${o.uuid}`)
                                    }
                                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <Td className="whitespace-nowrap">
                                        <p className="font-mono font-bold text-[#0c1d37] dark:text-slate-100">
                                            {o.code}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {formatDateTime(o.created_at)}
                                        </p>
                                    </Td>
                                    <Td className="max-w-[280px]">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                                            {o.customer_name}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {o.project_title}
                                        </p>
                                    </Td>
                                    <Td
                                        align="right"
                                        className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                    >
                                        Rp{' '}
                                        {Number(o.total_price).toLocaleString(
                                            'id-ID',
                                            { maximumFractionDigits: 0 },
                                        )}
                                    </Td>
                                    <Td align="center">{paymentBadge(o)}</Td>
                                    <Td align="center">
                                        <Badge tone={st.tone}>{st.label}</Badge>
                                    </Td>
                                    <Td
                                        align="right"
                                        className="whitespace-nowrap"
                                    >
                                        {o.status === 'PENDING_APPROVAL' && (
                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-7 rounded-md bg-amber-500 px-2.5 text-xs font-semibold text-white hover:bg-amber-600"
                                            >
                                                <Link
                                                    href={`/sales/orders/${o.uuid}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MapPin className="mr-1 size-3.5" />{' '}
                                                    Verifikasi
                                                </Link>
                                            </Button>
                                        )}
                                        {canSpk && (
                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-7 rounded-md bg-[#0c1d37] px-2.5 text-xs font-semibold text-white hover:bg-[#162e55]"
                                            >
                                                <Link
                                                    href={`/production/work-orders/create?order_id=${o.id}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <FileSpreadsheet className="mr-1 size-3.5" />{' '}
                                                    Buat SPK
                                                </Link>
                                            </Button>
                                        )}
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

OrderIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pesanan Pelanggan', href: '/sales/orders' },
    ],
};
