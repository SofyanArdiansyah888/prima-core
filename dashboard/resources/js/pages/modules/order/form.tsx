import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, ShoppingCart, MapPin, Calculator, Plus, Trash2, CheckCircle, Navigation } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';

type Product = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    base_price: number;
    max_trip_capacity: number;
    allow_combined_delivery: boolean;
};

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    lat: number;
    lng: number;
};

export default function OrderForm({
    plants,
    products,
    customerTypes,
    paymentMethods,
}: {
    plants: Plant[];
    products: Product[];
    customerTypes: { value: string; label: string }[];
    paymentMethods: { value: string; label: string }[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_type: 'B2C',
        project_title: '',
        delivery_address: '',
        delivery_lat: null as number | null,
        delivery_lng: null as number | null,
        batching_plant_id: '' as unknown as number,
        distance_km: 0,
        delivery_fee: 0,
        payment_method: 'TRANSFER_BANK',
        payment_status: 'PENDING',
        po_number: '',
        notes: '',
        items: [
            {
                product_id: products[0]?.id ?? 1,
                quantity: '' as unknown as number,
                notes: '',
            },
        ],
    });

    const [isCalculating, setIsCalculating] = useState(false);
    const [calcDetails, setCalcDetails] = useState<string | null>(null);

    // Preset quick locations in Sulsel for demonstration
    const presetLocations = [
        { name: 'Pangkep (Proyek Green Minasa)', lat: -4.805, lng: 119.561, address: 'Jl. Poros Tonasa II, Bontoa, Kab. Pangkep' },
        { name: 'Makassar (Pelabuhan MNP / KIMA)', lat: -5.105, lng: 119.432, address: 'Kawasan Pelabuhan Makassar New Port, Makassar' },
        { name: 'Maros (Ruko Daya / Lau)', lat: -4.985, lng: 119.572, address: 'Jl. Poros Maros - Pangkep Km 8, Lau, Maros' },
        { name: 'Makassar Pusat (Panakkukang)', lat: -5.138, lng: 119.445, address: 'Jl. Urip Sumoharjo No. 120, Makassar' },
    ];

    const applyPresetLocation = (loc: { name: string; lat: number; lng: number; address: string }) => {
        setData((prev) => ({
            ...prev,
            delivery_lat: loc.lat,
            delivery_lng: loc.lng,
            delivery_address: loc.address,
        }));
        // Auto trigger nearest plant calculation
        calculateNearestPlant(loc.lat, loc.lng);
    };

    const calculateNearestPlant = async (lat = data.delivery_lat, lng = data.delivery_lng) => {
        setIsCalculating(true);
        try {
            const firstItem = data.items[0];
            const prod = products.find((p) => p.id === Number(firstItem?.product_id));
            const totalQty = data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

            const res = await fetch('/api/delivery-rates/calculate-nearest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    lat,
                    lng,
                    category: prod?.category ?? 'readymix',
                    quantity: totalQty,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                setData((prev) => ({
                    ...prev,
                    batching_plant_id: result.plant.id,
                    distance_km: result.distance_km,
                    delivery_fee: result.delivery_fee,
                }));
                setCalcDetails(`Plant Terdekat: ${result.plant.name} (${result.distance_km} Km) · ${result.details}`);
                toast.success(`Plant terdekat otomatis dipilih: ${result.plant.name} (${result.distance_km} Km)`);
            }
        } catch {
            toast.error('Gagal menghitung tarif terdekat.');
        } finally {
            setIsCalculating(false);
        }
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { product_id: products[0]?.id ?? 1, quantity: 1, notes: '' },
        ]);
    };

    const removeItem = (index: number) => {
        if (data.items.length === 1) return;
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    // Calculate subtotal & grand total
    const subtotal = data.items.reduce((sum, item) => {
        const prod = products.find((p) => p.id === Number(item.product_id));
        return sum + (prod ? Number(prod.base_price) * Number(item.quantity || 0) : 0);
    }, 0);

    const deliveryFee = Number(data.delivery_fee) || 0;
    const ppn = (subtotal + deliveryFee) * 0.11;
    const grandTotal = subtotal + deliveryFee + ppn;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales/orders');
    };

    return (
        <>
            <Head title="Input Pesanan Baru (Sales Order)" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="size-9 rounded-lg">
                        <Link href="/sales/orders">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Input Pesanan Baru (Sales Order)
                        </h1>
                        <p className="text-xs text-slate-500">
                            Pilih produk, tentukan titik lokasi proyek, dan sistem akan mengarahkan ke Batching Plant terdekat beserta kalkulasi ongkir.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Customer & Project Info */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                1. Data Pemesan & Informasi Proyek
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="customer_name">Nama Pemesan / Perusahaan *</Label>
                                <Input
                                    id="customer_name"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    placeholder="Contoh: PT Mitra Kontraktor Utama / Bpk. H. Rasyid"
                                    className="mt-1.5"
                                />
                                {errors.customer_name && <p className="mt-1 text-xs text-rose-600">{errors.customer_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="customer_type">Tipe Pelanggan *</Label>
                                <select
                                    id="customer_type"
                                    value={data.customer_type}
                                    onChange={(e) => setData('customer_type', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {customerTypes.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="customer_phone">Nomor Telepon / WhatsApp</Label>
                                <Input
                                    id="customer_phone"
                                    value={data.customer_phone}
                                    onChange={(e) => setData('customer_phone', e.target.value)}
                                    placeholder="Contoh: 0812-4112-9901"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div>
                                <Label htmlFor="customer_email">Email</Label>
                                <Input
                                    id="customer_email"
                                    type="email"
                                    value={data.customer_email}
                                    onChange={(e) => setData('customer_email', e.target.value)}
                                    placeholder="procurement@kontraktor.co.id"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="project_title">Nama / Judul Proyek *</Label>
                                <Input
                                    id="project_title"
                                    value={data.project_title}
                                    onChange={(e) => setData('project_title', e.target.value)}
                                    placeholder="Contoh: Pembangunan Perumahan Green Minasa Blok B4"
                                    className="mt-1.5"
                                />
                                {errors.project_title && <p className="mt-1 text-xs text-rose-600">{errors.project_title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="po_number">Nomor PO Proyek (Jika B2B)</Label>
                                <Input
                                    id="po_number"
                                    value={data.po_number}
                                    onChange={(e) => setData('po_number', e.target.value)}
                                    placeholder="Contoh: PO-MKU/PKM/2026/042"
                                    className="mt-1.5 font-mono"
                                />
                            </div>

                            <div>
                                <Label htmlFor="payment_method">Metode Pembayaran *</Label>
                                <select
                                    id="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {paymentMethods.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location & Nearest Batching Plant Auto-Calculation */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                    2. Lokasi Proyek & Batching Plant Terdekat
                                </h2>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => calculateNearestPlant()}
                                disabled={isCalculating}
                                className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"
                            >
                                <Calculator className="size-3.5" />
                                {isCalculating ? 'Menghitung...' : 'Hitung Ulang Jarak & Ongkir'}
                            </Button>
                        </div>

                        {/* Quick preset locations */}
                        <div className="mb-4">
                            <Label className="text-xs text-slate-500">Pilih Preset Lokasi Uji Coba Cepat:</Label>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                                {presetLocations.map((loc, idx) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => applyPresetLocation(loc)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                    >
                                        <Navigation className="size-3 text-emerald-600" />
                                        {loc.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="delivery_address">Alamat Lengkap Pengantaran *</Label>
                                <Textarea
                                    id="delivery_address"
                                    rows={2}
                                    value={data.delivery_address}
                                    onChange={(e) => setData('delivery_address', e.target.value)}
                                    placeholder="Contoh: Jl. Poros Tonasa II, Bontoa, Kab. Pangkep (Dekat Gerbang Pabrik)"
                                    className="mt-1.5"
                                />
                                {errors.delivery_address && <p className="mt-1 text-xs text-rose-600">{errors.delivery_address}</p>}
                            </div>

                            <div>
                                <Label htmlFor="delivery_lat">Koordinat Latitude (Titik Pinpoint)</Label>
                                <Input
                                    id="delivery_lat"
                                    type="number"
                                    step="0.0000001"
                                    value={data.delivery_lat}
                                    onChange={(e) => setData('delivery_lat', Number(e.target.value))}
                                    className="mt-1.5 font-mono text-xs"
                                />
                            </div>

                            <div>
                                <Label htmlFor="delivery_lng">Koordinat Longitude (Titik Pinpoint)</Label>
                                <Input
                                    id="delivery_lng"
                                    type="number"
                                    step="0.0000001"
                                    value={data.delivery_lng}
                                    onChange={(e) => setData('delivery_lng', Number(e.target.value))}
                                    className="mt-1.5 font-mono text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                            <CheckCircle className="size-4 text-emerald-600" />
                                            Batching Plant Rekomendasi Terdekat:
                                        </div>
                                        <div className="mt-1">
                                            <select
                                                value={data.batching_plant_id}
                                                onChange={(e) => setData('batching_plant_id', Number(e.target.value))}
                                                className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
                                            >
                                                {plants.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} ({p.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {calcDetails && (
                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                {calcDetails}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Jarak Tempuh</span>
                                            <p className="text-base font-bold text-slate-900 dark:text-white">
                                                {Number(data.distance_km).toFixed(1)} Km
                                            </p>
                                        </div>
                                        <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Estimasi Ongkir</span>
                                            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                                                Rp {Number(data.delivery_fee).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                3. Item Produk & Material Dipesan
                            </h2>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1 text-xs">
                                <Plus className="size-3.5" /> Tambah Item
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.items.map((item, index) => {
                                const selectedProd = products.find((p) => p.id === Number(item.product_id));
                                const itemSubtotal = selectedProd ? Number(selectedProd.base_price) * Number(item.quantity || 0) : 0;

                                return (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-12 items-end dark:border-slate-800 dark:bg-slate-800/40"
                                    >
                                        <div className="sm:col-span-5">
                                            <Label className="text-xs">Produk / Mutu Beton *</Label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            >
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} (Rp {Number(p.base_price).toLocaleString('id-ID')}/{p.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <Label className="text-xs">Volume / Quantity ({selectedProd?.unit ?? 'm³'}) *</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="sm:col-span-3">
                                            <Label className="text-xs">Subtotal Item</Label>
                                            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                                                Rp {itemSubtotal.toLocaleString('id-ID')}
                                            </p>
                                        </div>

                                        <div className="sm:col-span-1 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={data.items.length === 1}
                                                className="h-9 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cost Summary Box */}
                        <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 max-w-sm ml-auto space-y-2">
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Subtotal Material:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Ongkos Kirim Plant:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {deliveryFee.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>PPN (11%):</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {ppn.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                                <span>Total Tagihan:</span>
                                <span className="text-emerald-700 dark:text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/sales/orders">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-700 font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
                        >
                            <Save className="size-4" />
                            Simpan & Terbitkan Pesanan
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OrderForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pesanan & Penjualan', href: '/sales/orders' },
        { title: 'Input Pesanan Baru', href: '#' },
    ],
};
