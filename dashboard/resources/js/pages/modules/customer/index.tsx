import { Head, router, usePage } from '@inertiajs/react';
import { Power } from 'lucide-react';
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
    Td,
    Th,
} from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { dashboard } from '@/routes';
import { ToggleCustomerModal } from './toggle-customer-modal';

type CustomerRow = {
    id: number;
    uuid: string;
    name: string;
    phone: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
    orders_count: number;
    orders_total: number | string | null;
    last_order_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
};

export default function CustomerIndex({
    customers,
    plants,
    filters,
    can_toggle,
}: {
    customers: Paginated<CustomerRow>;
    plants: { id: number; code: string; name: string }[];
    filters: { search?: string; status?: string; batching_plant_id?: string };
    can_toggle: boolean;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toggleTarget, setToggleTarget] = useState<CustomerRow | null>(null);
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
            '/sales/customers',
            { search, status, batching_plant_id: plantId, ...params },
            { preserveState: true },
        );

    return (
        <>
            <Head title="Pelanggan" />
            <ListPage>
                <ListHeader
                    title="Pelanggan"
                    subtitle={
                        can_toggle
                            ? 'Akun pelanggan yang terdaftar dari aplikasi mobile.'
                            : 'Pelanggan yang pernah memesan di batching plant Anda.'
                    }
                />

                <ListToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onSubmit={() => go({})}
                    placeholder="Cari nama, no. HP, atau email…"
                >
                    <FilterSelect
                        value={status}
                        onChange={(v) => go({ status: v })}
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </FilterSelect>
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
                            <Th>Pelanggan</Th>
                            <Th>Kontak</Th>
                            <Th align="center">Pesanan</Th>
                            <Th align="right">Total Belanja</Th>
                            <Th>Pesanan Terakhir</Th>
                            <Th align="center">Status</Th>
                            {can_toggle && <Th align="right"> </Th>}
                        </tr>
                    }
                    footer={
                        <Pagination
                            links={customers.links}
                            total={customers.total}
                            shown={customers.data.length}
                        />
                    }
                >
                    {customers.data.length === 0 ? (
                        <EmptyRow
                            colSpan={can_toggle ? 7 : 6}
                            message="Tidak ada pelanggan yang sesuai filter."
                        />
                    ) : (
                        customers.data.map((c) => (
                            <tr
                                key={c.uuid}
                                onClick={() =>
                                    router.visit(`/sales/customers/${c.uuid}`)
                                }
                                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                                <Td className="max-w-[260px]">
                                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                                        {c.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Terdaftar {formatDate(c.created_at)}
                                    </p>
                                </Td>
                                <Td className="max-w-[240px]">
                                    <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                        {c.phone}
                                    </p>
                                    <p className="truncate text-[11px] text-slate-500">
                                        {c.email ?? '—'}
                                    </p>
                                </Td>
                                <Td align="center" className="font-semibold">
                                    {c.orders_count}
                                </Td>
                                <Td
                                    align="right"
                                    className="font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white"
                                >
                                    {formatCurrency(c.orders_total)}
                                </Td>
                                <Td className="text-xs whitespace-nowrap text-slate-500">
                                    {c.last_order_at
                                        ? formatDateTime(c.last_order_at)
                                        : '—'}
                                </Td>
                                <Td align="center">
                                    <Badge tone={c.is_active ? 'emerald' : 'slate'}>
                                        {c.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </Td>
                                {can_toggle && (
                                    <Td align="right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={
                                                c.is_active
                                                    ? 'size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40'
                                                    : 'size-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40'
                                            }
                                            title={
                                                c.is_active
                                                    ? 'Nonaktifkan akun'
                                                    : 'Aktifkan akun'
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setToggleTarget(c);
                                            }}
                                        >
                                            <Power className="size-3.5" />
                                            <span className="sr-only">
                                                {c.is_active
                                                    ? 'Nonaktifkan'
                                                    : 'Aktifkan'}
                                            </span>
                                        </Button>
                                    </Td>
                                )}
                            </tr>
                        ))
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

CustomerIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pelanggan', href: '/sales/customers' },
    ],
};
