import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Badge,
    EmptyRow,
    ListPage,
    ListTable,
    Pagination,
    Td,
    Th,
} from '@/components/list-page';
import type { Tone } from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { dashboard } from '@/routes';
import { ToggleCustomerModal } from './toggle-customer-modal';

type Customer = {
    id: number;
    uuid: string;
    name: string;
    phone: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
};

type OrderRow = {
    id: number;
    uuid: string;
    code: string;
    project_title: string;
    total_price: number | string;
    payment_status: string;
    status: string;
    created_at: string;
    batching_plant: { id: number; code: string; name: string } | null;
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

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

export default function CustomerShow({
    customer,
    stats,
    orders,
    can_toggle,
}: {
    customer: Customer;
    stats: {
        orders_count: number;
        orders_total: number;
        last_order_at: string | null;
    };
    orders: Paginated<OrderRow>;
    can_toggle: boolean;
}) {
    const [toggleTarget, setToggleTarget] = useState<Customer | null>(null);
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

    return (
        <>
            <Head title={`Pelanggan · ${customer.name}`} />
            <ListPage>
                <div>
                    <Link
                        href="/sales/customers"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-3.5" /> Kembali ke daftar
                    </Link>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {customer.name}
                            </h1>
                            <Badge tone={customer.is_active ? 'emerald' : 'slate'}>
                                {customer.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:gap-5 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 font-mono">
                                <Phone className="size-3.5" /> {customer.phone}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                                <Mail className="size-3.5 shrink-0" />
                                <span className="truncate">
                                    {customer.email ?? '—'}
                                </span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Terdaftar sejak {formatDate(customer.created_at)}
                        </p>
                    </div>
                    {can_toggle && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={
                                customer.is_active
                                    ? 'h-9 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                                    : 'h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }
                            onClick={() => setToggleTarget(customer)}
                        >
                            <Power className="size-4" />
                            {customer.is_active
                                ? 'Nonaktifkan Akun'
                                : 'Aktifkan Akun'}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Stat label="Jumlah Pesanan" value={String(stats.orders_count)} />
                    <Stat
                        label="Total Belanja"
                        value={formatCurrency(stats.orders_total)}
                    />
                    <Stat
                        label="Pesanan Terakhir"
                        value={
                            stats.last_order_at
                                ? formatDate(stats.last_order_at)
                                : '—'
                        }
                    />
                </div>

                <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    Riwayat Pesanan
                </h2>
                <ListTable
                    head={
                        <tr>
                            <Th>No. Pesanan</Th>
                            <Th>Proyek</Th>
                            <Th>Plant</Th>
                            <Th align="right">Total</Th>
                            <Th align="center">Status</Th>
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
                            colSpan={5}
                            message="Pelanggan ini belum memiliki pesanan."
                        />
                    ) : (
                        orders.data.map((o) => {
                            const st = STATUS[o.status] ?? {
                                label: o.status,
                                tone: 'slate' as Tone,
                            };

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
                                        <p className="truncate">
                                            {o.project_title}
                                        </p>
                                    </Td>
                                    <Td className="text-xs whitespace-nowrap">
                                        {o.batching_plant?.name ?? '—'}
                                    </Td>
                                    <Td
                                        align="right"
                                        className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                    >
                                        {formatCurrency(o.total_price)}
                                    </Td>
                                    <Td align="center">
                                        <Badge tone={st.tone}>{st.label}</Badge>
                                    </Td>
                                </tr>
                            );
                        })
                    )}
                </ListTable>

                <ToggleCustomerModal
                    customer={toggleTarget}
                    onClose={() => setToggleTarget(null)}
                />
            </ListPage>
        </>
    );
}

CustomerShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pelanggan', href: '/sales/customers' },
    ],
};
