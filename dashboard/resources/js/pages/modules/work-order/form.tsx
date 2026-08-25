import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type Order = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    project_title: string;
    batching_plant_id: number;
    batching_plant?: { id: number; name: string; code: string };
    items: {
        id: number;
        product_id: number;
        quantity: number;
        unit: string;
        product: { id: number; name: string; code: string; slump: string | null };
    }[];
};

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
};

type User = {
    id: number;
    name: string;
    code: string;
    role: string;
};

export default function WorkOrderForm({
    selectedOrder,
    orders,
    plants,
    users,
}: {
    selectedOrder: Order | null;
    orders: Order[];
    plants: Plant[];
    users: User[];
}) {
    const defaultOrder = selectedOrder ?? orders[0];
    const defaultProduct = defaultOrder?.items[0];

    const { data, setData, post, processing, errors } = useForm({
        order_id: selectedOrder?.id ?? '',
        product_id: defaultProduct?.product_id ?? '',
        batching_plant_id: selectedOrder?.batching_plant_id ?? plants[0]?.id ?? '',
        assigned_user_id: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time_slot: '',
        target_quantity: (defaultProduct ? Number(defaultProduct.quantity) - Number(defaultProduct.fulfilled_quantity) : '') as unknown as number,
        batch_recipe_code: '',
        slump_target: defaultProduct?.product?.slump ?? '',
        production_notes: '',
    });

    const handleOrderChange = (orderId: number) => {
        const ord = orders.find((o) => o.id === orderId);
        if (ord) {
            const prod = ord.items[0];
            setData({
                ...data,
                order_id: ord.id,
                batching_plant_id: ord.batching_plant_id,
                product_id: prod?.product_id ?? '',
                target_quantity: prod?.quantity ?? 7,
                slump_target: prod?.product?.slump ?? '12 ± 2 cm',
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/production/work-orders');
    };

    return (
        <>
            <Head title="Terbitkan Surat Perintah Kerja (SPK)" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href="/production/work-orders">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Terbitkan Surat Perintah Kerja (SPK Produksi)
                        </h1>
                        <p className="text-xs text-slate-500">
                            Jadwalkan batching plant dan formula campuran mutu beton berdasarkan sales order customer.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <FileSpreadsheet className="size-5 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Detail Perintah Produksi & Batching
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="order_id">Pilih Sales Order Acuan *</Label>
                                <select
                                    id="order_id"
                                    value={data.order_id}
                                    onChange={(e) => handleOrderChange(Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {orders.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.code} — {o.customer_name} ({o.project_title})
                                        </option>
                                    ))}
                                </select>
                                {errors.order_id && <p className="mt-1 text-xs text-rose-600">{errors.order_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="batching_plant_id">Batching Plant Pelaksana *</Label>
                                <select
                                    id="batching_plant_id"
                                    value={data.batching_plant_id}
                                    onChange={(e) => setData('batching_plant_id', Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {plants.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.batching_plant_id && <p className="mt-1 text-xs text-rose-600">{errors.batching_plant_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="assigned_user_id">Operator Batching Penanggung Jawab</Label>
                                <select
                                    id="assigned_user_id"
                                    value={data.assigned_user_id}
                                    onChange={(e) => setData('assigned_user_id', Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="target_quantity">Target Volume Produksi *</Label>
                                <Input
                                    id="target_quantity"
                                    type="number"
                                    step="0.1"
                                    value={data.target_quantity}
                                    onChange={(e) => setData('target_quantity', Number(e.target.value))}
                                    className="mt-1.5"
                                />
                                {errors.target_quantity && <p className="mt-1 text-xs text-rose-600">{errors.target_quantity}</p>}
                            </div>

                            <div>
                                <Label htmlFor="scheduled_date">Tanggal Rencana Batching *</Label>
                                <Input
                                    id="scheduled_date"
                                    type="date"
                                    value={data.scheduled_date}
                                    onChange={(e) => setData('scheduled_date', e.target.value)}
                                    className="mt-1.5"
                                />
                                {errors.scheduled_date && <p className="mt-1 text-xs text-rose-600">{errors.scheduled_date}</p>}
                            </div>

                            <div>
                                <Label htmlFor="scheduled_time_slot">Slot Waktu Pengecoran / Produksi</Label>
                                <Input
                                    id="scheduled_time_slot"
                                    value={data.scheduled_time_slot}
                                    onChange={(e) => setData('scheduled_time_slot', e.target.value)}
                                    placeholder="Contoh: 08:00 - 12:00 WITA"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="batch_recipe_code">Kode Resep Mix Design (Batch Recipe)</Label>
                                <Input
                                    id="batch_recipe_code"
                                    value={data.batch_recipe_code}
                                    onChange={(e) => setData('batch_recipe_code', e.target.value)}
                                    placeholder="Contoh: MIX-K300-TONASA-PCC"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div>
                                <Label htmlFor="slump_target">Target Slump Beton</Label>
                                <Input
                                    id="slump_target"
                                    value={data.slump_target}
                                    onChange={(e) => setData('slump_target', e.target.value)}
                                    placeholder="Contoh: 12 ± 2 cm"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="production_notes">Instruksi Khusus Lapangan / QC</Label>
                                <Textarea
                                    id="production_notes"
                                    rows={3}
                                    value={data.production_notes}
                                    onChange={(e) => setData('production_notes', e.target.value)}
                                    placeholder="Contoh: Pengecoran slab dak lantai 2, perhatikan slump dan temperatur adukan beton..."
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/production/work-orders">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-purple-700 font-medium text-white hover:bg-purple-800 dark:bg-purple-600"
                        >
                            <Save className="size-4" />
                            Terbitkan Surat Perintah Kerja
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

WorkOrderForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Work Orders', href: '/production/work-orders' },
        { title: 'Terbitkan SPK Baru', href: '#' },
    ],
};
