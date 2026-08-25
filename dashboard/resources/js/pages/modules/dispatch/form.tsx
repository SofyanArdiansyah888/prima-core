import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Truck, Plus, Trash2, AlertTriangle, Layers, Scale, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
};

type Order = {
    id: number;
    uuid: string;
    code: string;
    customer_name: string;
    project_title: string;
    delivery_address: string;
    delivery_lat: number | null;
    delivery_lng: number | null;
    batching_plant_id: number;
    items: {
        id: number;
        product_id: number;
        quantity: number;
        fulfilled_quantity: number;
        unit: string;
        product: {
            id: number;
            uuid: string;
            code: string;
            name: string;
            category: string;
            unit: string;
            max_trip_capacity: number;
            allow_combined_delivery: boolean;
        };
    }[];
    work_orders: {
        id: number;
        code: string;
        target_quantity: number;
        dispatched_quantity: number;
        status: string;
    }[];
};

export default function DispatchForm({
    plants,
    activeOrders,
    vehicleTypes,
}: {
    plants: Plant[];
    activeOrders: Order[];
    vehicleTypes: { value: string; label: string }[];
}) {
    const defaultPlant = plants[0];
    const defaultOrder = activeOrders[0];
    const defaultItem = defaultOrder?.items[0];

    const { data, setData, post, processing, errors } = useForm({
        batching_plant_id: defaultPlant?.id ?? '',
        vehicle_number: '',
        vehicle_type: 'MIXER_TRUCK_7M3',
        driver_name: '',
        driver_phone: '',
        gross_weight_kg: '' as unknown as number,
        tare_weight_kg: '' as unknown as number,
        net_weight_kg: 0,
        nota_timbangan_number: '',
        notes: '',
        items: [
            {
                order_id: '' as unknown as number,
                work_order_id: null as number | null,
                product_id: '' as unknown as number,
                quantity_delivered: '' as unknown as number,
                destination_customer_name: '',
                destination_project_title: '',
                destination_address: '',
                destination_lat: null as number | null,
                destination_lng: null as number | null,
                delivery_sequence: 1,
                notes: '',
            },
        ],
    });

    // Auto-calculate Net Weight
    const handleGrossWeight = (gross: number) => {
        const tare = Number(data.tare_weight_kg) || 0;
        setData((prev) => ({
            ...prev,
            gross_weight_kg: gross,
            net_weight_kg: Math.max(0, gross - tare),
        }));
    };

    const handleTareWeight = (tare: number) => {
        const gross = Number(data.gross_weight_kg) || 0;
        setData((prev) => ({
            ...prev,
            tare_weight_kg: tare,
            net_weight_kg: Math.max(0, gross - tare),
        }));
    };

    // Check combinable logic across selected items
    const selectedProductIds = data.items.map((it) => Number(it.product_id));
    const allProducts = activeOrders.flatMap((o) => o.items.map((i) => i.product));
    const hasNonCombinableProduct = data.items.some((it) => {
        const prod = allProducts.find((p) => p.id === Number(it.product_id));
        return prod && !prod.allow_combined_delivery;
    });

    const uniqueOrderIds = Array.from(new Set(data.items.map((it) => it.order_id)));
    const isMultiCustomer = uniqueOrderIds.length > 1;
    const isCombinableConflict = hasNonCombinableProduct && isMultiCustomer;

    const handleSelectOrderItem = (index: number, orderId: number, productId: number) => {
        const order = activeOrders.find((o) => o.id === orderId);
        const item = order?.items.find((i) => i.product_id === productId) ?? order?.items[0];
        const remainingQty = item ? Math.max(0.1, Number(item.quantity) - Number(item.fulfilled_quantity)) : 1;
        const defaultQty = item ? Math.min(Number(item.product.max_trip_capacity), remainingQty) : 1;

        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            order_id: orderId,
            work_order_id: order?.work_orders[0]?.id ?? null,
            product_id: item?.product_id ?? productId,
            quantity_delivered: defaultQty,
            destination_customer_name: order?.customer_name ?? '',
            destination_project_title: order?.project_title ?? '',
            destination_address: order?.delivery_address ?? '',
            destination_lat: order?.delivery_lat ?? null,
            destination_lng: order?.delivery_lng ?? null,
        };
        setData('items', newItems);
    };

    const addDropStop = () => {
        if (hasNonCombinableProduct) {
            toast.error('Produk Ready Mix / Khusus tidak dapat digabung pengirimannya dengan customer lain.');
            return;
        }

        const nextOrder = activeOrders.find((o) => !uniqueOrderIds.includes(o.id)) ?? activeOrders[0];
        const nextItem = nextOrder?.items[0];

        setData('items', [
            ...data.items,
            {
                order_id: nextOrder?.id ?? 1,
                work_order_id: nextOrder?.work_orders[0]?.id ?? null,
                product_id: nextItem?.product_id ?? 1,
                quantity_delivered: nextItem ? Math.min(Number(nextItem.product.max_trip_capacity), Number(nextItem.quantity)) : 1,
                destination_customer_name: nextOrder?.customer_name ?? '',
                destination_project_title: nextOrder?.project_title ?? '',
                destination_address: nextOrder?.delivery_address ?? '',
                destination_lat: nextOrder?.delivery_lat ?? null,
                destination_lng: nextOrder?.delivery_lng ?? null,
                delivery_sequence: data.items.length + 1,
                notes: '',
            },
        ]);
    };

    const removeDropStop = (index: number) => {
        if (data.items.length === 1) return;
        const newItems = data.items.filter((_, i) => i !== index).map((it, i) => ({ ...it, delivery_sequence: i + 1 }));
        setData('items', newItems);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCombinableConflict) {
            toast.error('Produk Ready Mix atau semen curah khusus tidak dapat digabung multi-customer dalam 1 ritase armada!');
            return;
        }
        post('/dispatch/surat-jalan');
    };

    return (
        <>
            <Head title="Terbitkan Surat Jalan Baru" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href="/dispatch/surat-jalan">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Terbitkan Surat Jalan & Ritase Pengantaran
                        </h1>
                        <p className="text-xs text-slate-500">
                            Atur armada pengangkut, timbangan muatan netto, serta alokasi pengantaran (Single Trip maupun Multi-Drop Gabungan).
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Vehicle & Driver Info */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                1. Informasi Armada & Pengemudi
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="batching_plant_id">Batching Plant Keberangkatan *</Label>
                                <select
                                    id="batching_plant_id"
                                    value={data.batching_plant_id}
                                    onChange={(e) => setData('batching_plant_id', Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {plants.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="vehicle_type">Tipe Armada / Kendaraan *</Label>
                                <select
                                    id="vehicle_type"
                                    value={data.vehicle_type}
                                    onChange={(e) => setData('vehicle_type', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {vehicleTypes.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="vehicle_number">Nomor Polisi Armada (Nopol) *</Label>
                                <Input
                                    id="vehicle_number"
                                    value={data.vehicle_number}
                                    onChange={(e) => setData('vehicle_number', e.target.value.toUpperCase())}
                                    placeholder="Contoh: DD 8912 PKM"
                                    className="mt-1.5 font-mono"
                                />
                                {errors.vehicle_number && <p className="mt-1 text-xs text-rose-600">{errors.vehicle_number}</p>}
                            </div>

                            <div>
                                <Label htmlFor="driver_name">Nama Pengemudi (Driver) *</Label>
                                <Input
                                    id="driver_name"
                                    value={data.driver_name}
                                    onChange={(e) => setData('driver_name', e.target.value)}
                                    placeholder="Contoh: Pak Syamsuddin"
                                    className="mt-1.5"
                                />
                                {errors.driver_name && <p className="mt-1 text-xs text-rose-600">{errors.driver_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="driver_phone">Nomor Telepon Driver</Label>
                                <Input
                                    id="driver_phone"
                                    value={data.driver_phone}
                                    onChange={(e) => setData('driver_phone', e.target.value)}
                                    placeholder="0812-4112-9901"
                                    className="mt-1.5 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Weight Scale / Nota Timbangan Box */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                2. Jembatan Timbang & Nota Timbangan Digital
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-4">
                            <div>
                                <Label htmlFor="nota_timbangan_number">Nomor Nota Timbang</Label>
                                <Input
                                    id="nota_timbangan_number"
                                    value={data.nota_timbangan_number}
                                    onChange={(e) => setData('nota_timbangan_number', e.target.value.toUpperCase())}
                                    placeholder="NT-PKM-9912"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div>
                                <Label htmlFor="gross_weight_kg">Berat Gross (Kg)</Label>
                                <Input
                                    id="gross_weight_kg"
                                    type="number"
                                    value={data.gross_weight_kg}
                                    onChange={(e) => handleGrossWeight(Number(e.target.value))}
                                    placeholder="Contoh: 28450"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div>
                                <Label htmlFor="tare_weight_kg">Berat Tara Truk Kosong (Kg)</Label>
                                <Input
                                    id="tare_weight_kg"
                                    type="number"
                                    value={data.tare_weight_kg}
                                    onChange={(e) => handleTareWeight(Number(e.target.value))}
                                    placeholder="Contoh: 11200"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 flex flex-col justify-center">
                                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                                    Berat Netto Muatan:
                                </span>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                    {Number(data.net_weight_kg).toLocaleString('id-ID')} Kg
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Stops & Payload (Single or Combined Delivery) */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 dark:border-slate-800 gap-2">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                    3. Muatan & Tujuan Pengantaran (Delivery Stops)
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Pilih pesanan yang akan diangkut. Jika produk adalah Semen Sak / Mortar, Anda dapat menggabungkan multi-drop untuk beberapa customer dalam 1 armada.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addDropStop}
                                disabled={hasNonCombinableProduct}
                                className="h-8 gap-1 text-xs shrink-0"
                            >
                                <Plus className="size-3.5" /> Tambah Customer Gabungan (Stop 2)
                            </Button>
                        </div>

                        {/* Conflict Warning */}
                        {isCombinableConflict && (
                            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                                <div>
                                    <p className="font-bold">Peringatan Validasi Logistik:</p>
                                    <p>
                                        Muatan mengandung produk Ready Mix / Semen Curah yang tidak mengizinkan penggabungan customer. Satu ritase truk harus khusus untuk satu pesanan/customer saja.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {data.items.map((item, index) => {
                                const currentOrder = activeOrders.find((o) => o.id === Number(item.order_id));
                                const currentItem = currentOrder?.items.find((i) => i.product_id === Number(item.product_id)) ?? currentOrder?.items[0];

                                return (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                                Drop Stop #{item.delivery_sequence}
                                            </span>
                                            {data.items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeDropStop(index)}
                                                    className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3.5" /> Hapus Stop
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-12">
                                            <div className="sm:col-span-5">
                                                <Label className="text-xs">Pilih Pesanan Customer *</Label>
                                                <select
                                                    value={item.order_id}
                                                    onChange={(e) => handleSelectOrderItem(index, Number(e.target.value), Number(item.product_id))}
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                >
                                                    <option value="">-- Pilih Pesanan Customer --</option>
                                                    {activeOrders.map((o) => (
                                                        <option key={o.id} value={o.id}>
                                                            {o.code} — {o.customer_name} ({o.project_title})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="sm:col-span-4">
                                                <Label className="text-xs">Pilih Item Produk *</Label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => handleSelectOrderItem(index, Number(item.order_id), Number(e.target.value))}
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                >
                                                    <option value="">-- Pilih Item Produk --</option>
                                                    {currentOrder?.items.map((it) => (
                                                        <option key={it.product_id} value={it.product_id}>
                                                            {it.product.name} (Sisa: {Number(it.quantity) - Number(it.fulfilled_quantity)} {it.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <Label className="text-xs">Volume Ritase Ini ({currentItem?.unit ?? 'm³'}) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={item.quantity_delivered}
                                                    onChange={(e) => {
                                                        const newItems = [...data.items];
                                                        newItems[index].quantity_delivered = Number(e.target.value);
                                                        setData('items', newItems);
                                                    }}
                                                    className="mt-1 font-bold"
                                                />
                                            </div>

                                            <div className="sm:col-span-12 grid gap-3 sm:grid-cols-3 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                                                <div className="sm:col-span-2">
                                                    <Label className="text-[11px] text-slate-500">Alamat Lengkap Pengantaran (Khusus Customer Ini) *</Label>
                                                    <Input
                                                        value={item.destination_address}
                                                        onChange={(e) => {
                                                            const newItems = [...data.items];
                                                            newItems[index].destination_address = e.target.value;
                                                            setData('items', newItems);
                                                        }}
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-[11px] text-slate-500">Nama Penerima / PIC Lapangan</Label>
                                                    <Input
                                                        value={item.notes ?? ''}
                                                        onChange={(e) => {
                                                            const newItems = [...data.items];
                                                            newItems[index].notes = e.target.value;
                                                            setData('items', newItems);
                                                        }}
                                                        placeholder="Contoh: Bpk. H. Rasyid"
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-[11px] text-slate-500">Latitude Pinpoint</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.0000001"
                                                        value={item.destination_lat ?? ''}
                                                        onChange={(e) => {
                                                            const newItems = [...data.items];
                                                            newItems[index].destination_lat = Number(e.target.value);
                                                            setData('items', newItems);
                                                        }}
                                                        className="mt-1 font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-[11px] text-slate-500">Longitude Pinpoint</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.0000001"
                                                        value={item.destination_lng ?? ''}
                                                        onChange={(e) => {
                                                            const newItems = [...data.items];
                                                            newItems[index].destination_lng = Number(e.target.value);
                                                            setData('items', newItems);
                                                        }}
                                                        className="mt-1 font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-[11px] text-slate-500">Judul Proyek</Label>
                                                    <Input
                                                        value={item.destination_project_title ?? ''}
                                                        onChange={(e) => {
                                                            const newItems = [...data.items];
                                                            newItems[index].destination_project_title = e.target.value;
                                                            setData('items', newItems);
                                                        }}
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/dispatch/surat-jalan">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || isCombinableConflict}
                            className="bg-emerald-700 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
                        >
                            <Save className="size-4" />
                            Terbitkan Surat Jalan (Berangkat)
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

DispatchForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Surat Jalan', href: '/dispatch/surat-jalan' },
        { title: 'Terbitkan Surat Jalan', href: '#' },
    ],
};
