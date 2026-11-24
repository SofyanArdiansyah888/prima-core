import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Undo2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type ReturnableItem = {
    id: number;
    name: string | null;
    unit: string;
    quantity: number;
    fulfilled_quantity: number;
    unit_price: number;
    returnable: number;
    suggested: number;
};

type OrderSummary = {
    uuid: string;
    code: string;
    customer_name: string;
    project_title: string;
    total_price: number;
    plant: { code: string; name: string } | null;
};

const rupiah = (v: number) => `Rp ${Math.round(v).toLocaleString('id-ID')}`;
const fmtQty = (v: number) => Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });

export default function PaymentReturnForm({
    order,
    items,
    returnableAmount,
    ppnRate,
}: {
    order: OrderSummary;
    items: ReturnableItem[];
    returnableAmount: number;
    ppnRate: number;
}) {
    const { data, setData, post, processing, errors } = useForm({
        order_uuid: order.uuid,
        reason: '',
        customer_bank_name: '',
        customer_bank_account: '',
        customer_account_name: order.customer_name,
        items: items.map((i) => ({ order_item_id: i.id, quantity: i.suggested > 0 ? String(i.suggested) : '' })),
    });

    const subtotal = items.reduce((sum, item, idx) => sum + (Number(data.items[idx]?.quantity) || 0) * item.unit_price, 0);
    const ppn = Math.round(subtotal * ppnRate * 100) / 100;
    const total = subtotal + ppn;
    const overLimit = total > returnableAmount + 0.01;

    const setQty = (idx: number, value: string) => {
        const next = [...data.items];
        next[idx] = { ...next[idx], quantity: value };
        setData('items', next);
    };

    const errorFor = (key: string) => (errors as Record<string, string | undefined>)[key];

    return (
        <>
            <Head title={`Buat BA Retur ${order.code}`} />
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-4 md:p-8">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href={`/sales/orders/${order.uuid}`}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Buat Berita Acara Retur Pembayaran</h1>
                        <p className="text-xs text-slate-500">
                            <span className="font-mono font-semibold">{order.code}</span> · {order.customer_name} · {order.project_title}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/finance/payment-returns');
                    }}
                    className="space-y-5"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Volume yang Diretur</h2>
                        <p className="mb-4 text-xs text-slate-500">
                            Contoh: pesan 10 m³, terpakai cor 8 m³ → isi 2 m³. Nilai awal = volume yang belum terkirim. Ongkir & CP tidak ikut dikembalikan.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 text-[11px] text-slate-500 dark:border-slate-800">
                                    <tr>
                                        <th className="py-2 pr-3">Produk</th>
                                        <th className="py-2 pr-3 text-right">Dipesan</th>
                                        <th className="py-2 pr-3 text-right">Terkirim</th>
                                        <th className="py-2 pr-3 text-right">Harga Satuan</th>
                                        <th className="w-36 py-2 pr-3">Volume Retur</th>
                                        <th className="py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item, idx) => {
                                        const qty = Number(data.items[idx]?.quantity) || 0;

                                        return (
                                            <tr key={item.id}>
                                                <td className="py-2.5 pr-3 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                                                <td className="py-2.5 pr-3 text-right">{fmtQty(item.quantity)} {item.unit}</td>
                                                <td className="py-2.5 pr-3 text-right">{fmtQty(item.fulfilled_quantity)} {item.unit}</td>
                                                <td className="py-2.5 pr-3 text-right">{rupiah(item.unit_price)}</td>
                                                <td className="py-2.5 pr-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={item.returnable}
                                                            step="0.01"
                                                            value={data.items[idx]?.quantity ?? ''}
                                                            onChange={(e) => setQty(idx, e.target.value)}
                                                            disabled={item.returnable <= 0}
                                                            aria-label={`Volume retur ${item.name ?? ''}`}
                                                            className="h-8 font-mono text-xs"
                                                        />
                                                        <span className="text-slate-500">{item.unit}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">Maks {fmtQty(item.returnable)} {item.unit}</span>
                                                    <InputError message={errorFor(`items.${idx}.quantity`)} />
                                                </td>
                                                <td className="py-2.5 text-right font-semibold">{rupiah(qty * item.unit_price)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <InputError message={errorFor('items')} />

                        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-xs">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-semibold">{rupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>PPN {Math.round(ppnRate * 100)}%</span>
                                <span className="font-semibold">{rupiah(ppn)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                                <span>Total Dikembalikan</span>
                                <span className={overLimit ? 'text-[#d91424]' : 'text-emerald-700'}>{rupiah(total)}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">Sisa yang bisa dikembalikan: {rupiah(returnableAmount)}</p>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-1.5">
                            <Label htmlFor="reason" className="text-xs font-semibold">
                                Alasan Retur <span className="text-rose-500">*</span>
                            </Label>
                            <textarea
                                id="reason"
                                rows={3}
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="Contoh: Volume cor di lapangan hanya terpakai 8 m³ dari 10 m³ yang dipesan; sisa 2 m³ tidak dikirim."
                                className="w-full rounded-md border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                            />
                            <InputError message={errors.reason} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="bank" className="text-xs font-semibold">Bank Customer</Label>
                                <Input id="bank" value={data.customer_bank_name} onChange={(e) => setData('customer_bank_name', e.target.value)} placeholder="BRI / BNI / Mandiri" />
                                <InputError message={errors.customer_bank_name} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="account" className="text-xs font-semibold">No. Rekening</Label>
                                <Input id="account" value={data.customer_bank_account} onChange={(e) => setData('customer_bank_account', e.target.value)} className="font-mono" />
                                <InputError message={errors.customer_bank_account} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="holder" className="text-xs font-semibold">Atas Nama</Label>
                                <Input id="holder" value={data.customer_account_name} onChange={(e) => setData('customer_account_name', e.target.value)} />
                                <InputError message={errors.customer_account_name} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing || overLimit || total <= 0} className="h-10 bg-[#0c1d37] font-bold text-white hover:bg-[#162e55]">
                            {processing ? <Spinner /> : <Undo2 className="size-4" />} Ajukan Berita Acara
                        </Button>
                        <Button asChild type="button" variant="outline" className="h-10">
                            <Link href={`/sales/orders/${order.uuid}`}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
