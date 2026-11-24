import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Badge,
    EmptyRow,
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
import { formatDateTime } from '@/lib/utils';

type ReturnRow = {
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    amount: number;
    created_at: string | null;
    creator: string | null;
    order: { uuid: string; code: string; customer_name: string; project_title: string } | null;
    plant: { code: string; name: string } | null;
    awaiting_me: boolean;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

export const RETURN_STATUS_TONE: Record<string, Tone> = {
    PENDING_MANAGER: 'amber',
    PENDING_KADIV: 'amber',
    PENDING_FINANCE: 'amber',
    PENDING_DIRECTOR: 'amber',
    APPROVED: 'blue',
    REFUNDED: 'emerald',
    REJECTED: 'red',
};

const rupiah = (v: number) => `Rp ${Number(v).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

export default function PaymentReturnIndex({
    returns,
    filters,
    awaitingCount,
}: {
    returns: Paginated<ReturnRow>;
    filters: { tab: string; search: string };
    awaitingCount: number;
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const go = (params: Record<string, string>) => {
        router.get('/finance/payment-returns', { tab: filters.tab, search, ...params }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Retur Pembayaran" />
            <ListPage>
                <ListHeader
                    title="Retur Pembayaran (Berita Acara)"
                    subtitle="Pengembalian dana atas volume pesanan yang tidak terpakai. Disetujui berurutan: Manager → Kepala Divisi → Keuangan → Direksi."
                />

                <StatusChips
                    options={[
                        { value: 'mine', label: 'Menunggu Saya', count: awaitingCount },
                        { value: 'process', label: 'Dalam Proses' },
                        { value: 'done', label: 'Selesai / Ditolak' },
                    ]}
                    value={filters.tab === 'all' ? '' : filters.tab}
                    onChange={(v) => go({ tab: v || 'all' })}
                    allLabel="Semua"
                />

                <ListToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onSubmit={() => go({})}
                    placeholder="Cari no. BA, no. SO, atau customer..."
                />

                <ListTable
                    head={
                        <tr>
                            <Th>No. BA</Th>
                            <Th>Pesanan / Customer</Th>
                            <Th>Plant</Th>
                            <Th align="right">Nominal Retur</Th>
                            <Th align="center">Status</Th>
                            <Th>Dibuat</Th>
                        </tr>
                    }
                    footer={<Pagination links={returns.links} total={returns.total} shown={returns.data.length} />}
                >
                    {returns.data.length === 0 ? (
                        <EmptyRow colSpan={6} message="Belum ada Berita Acara retur pada tab ini." />
                    ) : (
                        returns.data.map((r) => (
                            <tr
                                key={r.uuid}
                                onClick={() => router.visit(`/finance/payment-returns/${r.uuid}`)}
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                                <Td>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{r.code}</span>
                                    {r.awaiting_me && (
                                        <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Perlu Anda</span>
                                    )}
                                </Td>
                                <Td>
                                    <span className="font-mono text-[11px] text-slate-500">{r.order?.code}</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{r.order?.customer_name}</p>
                                </Td>
                                <Td>{r.plant?.name ?? '—'}</Td>
                                <Td align="right">
                                    <span className="font-bold">{rupiah(r.amount)}</span>
                                </Td>
                                <Td align="center">
                                    <Badge tone={RETURN_STATUS_TONE[r.status] ?? 'slate'}>{r.status_label}</Badge>
                                </Td>
                                <Td>
                                    <span className="text-slate-500">{r.created_at ? formatDateTime(r.created_at) : '—'}</span>
                                    <p className="text-[11px] text-slate-400">{r.creator}</p>
                                </Td>
                            </tr>
                        ))
                    )}
                </ListTable>
            </ListPage>
        </>
    );
}
