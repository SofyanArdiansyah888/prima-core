import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, CheckCircle2, Circle, Printer, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/list-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { RETURN_STATUS_TONE } from './index';

type Step = {
    status: string;
    role: string;
    label: string;
    decision: 'approved' | 'rejected' | null;
    user: string | null;
    notes: string | null;
    decided_at: string | null;
};

type ReturnDetail = {
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    reason: string;
    subtotal: number;
    ppn: number;
    amount: number;
    customer_bank_name: string | null;
    customer_bank_account: string | null;
    customer_account_name: string | null;
    creator: string | null;
    created_at: string | null;
    refunded_at: string | null;
    refunder: string | null;
    refund_reference: string | null;
    order: { uuid: string; code: string; customer_name: string; customer_phone: string | null; project_title: string; total_price: string | number; payment_status: string; refund_amount: string | number | null } | null;
    plant: { code: string; name: string } | null;
    items: { name: string | null; unit: string | null; ordered_quantity: number; quantity: number; unit_price: number; subtotal: number }[];
    steps: Step[];
};

const rupiah = (v: number | string | null | undefined) => `Rp ${Math.round(Number(v ?? 0)).toLocaleString('id-ID')}`;
const fmtQty = (v: number) => Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });

export default function PaymentReturnShow({ paymentReturn: ba, can }: { paymentReturn: ReturnDetail; can: { decide: boolean; refund: boolean } }) {
    const [notes, setNotes] = useState('');
    const [reference, setReference] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = (action: 'approve' | 'reject' | 'refund', payload: Record<string, string>) => {
        setBusy(true);
        router.post(`/finance/payment-returns/${ba.uuid}/${action}`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setNotes('');
                setReference('');
            },
            onFinish: () => setBusy(false),
        });
    };

    return (
        <>
            <Head title={`BA Retur ${ba.code}`} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-4 md:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                            <Link href="/finance/payment-returns">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{ba.code}</span>
                                <Badge tone={RETURN_STATUS_TONE[ba.status] ?? 'slate'}>{ba.status_label}</Badge>
                            </div>
                            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Berita Acara Retur Pembayaran</h1>
                            <p className="text-xs text-slate-500">
                                Dibuat {ba.created_at ? formatDateTime(ba.created_at) : '—'} oleh {ba.creator ?? '—'}
                            </p>
                        </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                        <a href={`/finance/payment-returns/${ba.uuid}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="size-4" /> Cetak BA
                        </a>
                    </Button>
                </div>

                {/* Timeline approval */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Alur Persetujuan</h2>
                    <ol className="grid gap-3 sm:grid-cols-4">
                        {ba.steps.map((step) => {
                            const current = ba.status === step.status;

                            return (
                                <li
                                    key={step.role}
                                    className={`rounded-lg border p-3 ${
                                        step.decision === 'approved'
                                            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20'
                                            : step.decision === 'rejected'
                                              ? 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20'
                                              : current
                                                ? 'border-amber-300 bg-amber-50/70 ring-1 ring-amber-200 dark:border-amber-800 dark:bg-amber-950/20'
                                                : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {step.decision === 'approved' ? (
                                            <Check className="size-4 text-emerald-600" />
                                        ) : step.decision === 'rejected' ? (
                                            <XCircle className="size-4 text-red-600" />
                                        ) : (
                                            <Circle className={`size-4 ${current ? 'text-amber-500' : 'text-slate-300'}`} />
                                        )}
                                        {step.label}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {step.decision
                                            ? `${step.decision === 'approved' ? 'Disetujui' : 'Ditolak'} ${step.user ?? ''}${step.decided_at ? ` · ${formatDateTime(step.decided_at)}` : ''}`
                                            : current
                                              ? 'Menunggu keputusan'
                                              : 'Belum'}
                                    </p>
                                    {step.notes && <p className="mt-1 text-[11px] text-slate-700 italic dark:text-slate-300">“{step.notes}”</p>}
                                </li>
                            );
                        })}
                    </ol>

                    {can.decide && (
                        <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                            <label htmlFor="decision-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Catatan keputusan (wajib bila menolak)
                            </label>
                            <textarea
                                id="decision-notes"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" disabled={busy} onClick={() => submit('approve', { notes })} className="h-9 bg-emerald-700 font-bold text-white hover:bg-emerald-800">
                                    <CheckCircle2 className="mr-1.5 size-4" /> Setujui
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy || !notes.trim()}
                                    onClick={() => submit('reject', { notes })}
                                    className="h-9 border-red-200 font-bold text-[#d91424] hover:bg-red-50"
                                >
                                    <XCircle className="mr-1.5 size-4" /> Tolak
                                </Button>
                            </div>
                        </div>
                    )}

                    {can.refund && (
                        <div className="mt-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Direksi sudah menyetujui. Transfer {rupiah(ba.amount)} ke rekening customer, lalu catat referensinya.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="No. referensi / bukti transfer"
                                    aria-label="Referensi transfer"
                                    className="h-9 sm:max-w-xs"
                                />
                                <Button size="sm" disabled={busy || !reference.trim()} onClick={() => submit('refund', { refund_reference: reference })} className="h-9 bg-[#0c1d37] font-bold text-white">
                                    <Wallet className="mr-1.5 size-4" /> Tandai Dana Dikembalikan
                                </Button>
                            </div>
                        </div>
                    )}

                    {ba.refunded_at && (
                        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Dana dikembalikan {formatDateTime(ba.refunded_at)} oleh {ba.refunder ?? '—'} · Ref: {ba.refund_reference}
                        </p>
                    )}
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="space-y-5 lg:col-span-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">Rincian Volume Retur</h2>
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 text-[11px] text-slate-500 dark:border-slate-800">
                                    <tr>
                                        <th className="py-2">Produk</th>
                                        <th className="py-2 text-right">Dipesan</th>
                                        <th className="py-2 text-right">Diretur</th>
                                        <th className="py-2 text-right">Harga</th>
                                        <th className="py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {ba.items.map((i, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 font-semibold">{i.name}</td>
                                            <td className="py-2 text-right">{fmtQty(i.ordered_quantity)} {i.unit}</td>
                                            <td className="py-2 text-right font-bold">{fmtQty(i.quantity)} {i.unit}</td>
                                            <td className="py-2 text-right">{rupiah(i.unit_price)}</td>
                                            <td className="py-2 text-right">{rupiah(i.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-3 ml-auto max-w-xs space-y-1 text-xs">
                                <div className="flex justify-between"><span>Subtotal</span><span>{rupiah(ba.subtotal)}</span></div>
                                <div className="flex justify-between"><span>PPN 11%</span><span>{rupiah(ba.ppn)}</span></div>
                                <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold dark:border-slate-700">
                                    <span>Total Dikembalikan</span>
                                    <span className="text-emerald-700">{rupiah(ba.amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Alasan Retur</h2>
                            <p className="text-sm whitespace-pre-line text-slate-800 dark:text-slate-200">{ba.reason}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">Pesanan</h2>
                            {ba.order && (
                                <Link href={`/sales/orders/${ba.order.uuid}`} className="font-mono font-bold text-blue-700 hover:underline">
                                    {ba.order.code}
                                </Link>
                            )}
                            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{ba.order?.customer_name}</p>
                            <p className="text-slate-500">{ba.order?.project_title}</p>
                            <p className="mt-2 text-slate-500">Plant: {ba.plant?.name ?? '—'}</p>
                            <p className="text-slate-500">Total dibayar: {rupiah(ba.order?.total_price)}</p>
                            {Number(ba.order?.refund_amount ?? 0) > 0 && <p className="text-slate-500">Total sudah direfund: {rupiah(ba.order?.refund_amount)}</p>}
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">Rekening Tujuan</h2>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{ba.customer_bank_name ?? '—'}</p>
                            <p className="font-mono">{ba.customer_bank_account ?? '—'}</p>
                            <p className="text-slate-500">a.n. {ba.customer_account_name ?? '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
