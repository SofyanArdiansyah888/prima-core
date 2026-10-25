import { Head } from '@inertiajs/react';
import { formatDate } from '@/lib/utils';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SuratJalanDetail = {
    id: number;
    uuid: string;
    code: string;
    vehicle_number: string;
    vehicle_type: string;
    driver_name: string;
    driver_phone: string | null;
    status: string;
    departure_time: string | null;
    arrival_time: string | null;
    gross_weight_kg: number | null;
    tare_weight_kg: number | null;
    net_weight_kg: number | null;
    nota_timbangan_number: string | null;
    notes: string | null;
    created_at: string;
    driver?: { id: number; name: string; phone: string | null };
    batching_plant: {
        id: number;
        code: string;
        name: string;
        address: string | null;
        phone: string | null;
        branch?: { name: string };
    };
    items: {
        id: number;
        quantity_delivered: number;
        unit: string;
        destination_customer_name: string;
        destination_project_title: string | null;
        destination_address: string;
        delivery_sequence: number;
        recipient_name: string | null;
        product: { id: number; code: string; name: string; category: string; slump: string | null };
        order?: {
            id: number;
            code: string;
            po_number: string | null;
            distance_km: number | null;
            created_at: string;
            customer?: { name: string };
        };
        work_order?: {
            id: number;
            code: string;
            batch_recipe_code: string | null;
            slump_target: string | null;
            assigned_user?: { name: string };
        };
    }[];
};

export default function DispatchPrint({ suratJalan }: { suratJalan: SuratJalanDetail }) {
    const handlePrint = () => {
        window.print();
    };

    const firstItem = suratJalan.items[0];
    const customerName = firstItem?.order?.customer?.name || firstItem?.destination_customer_name || 'BANGUN KERJO';
    const projectTitle = firstItem?.destination_project_title || '-';
    const deliveryAddress = firstItem?.destination_address || 'BENTEN';
    const orderCode = firstItem?.order?.code || '-';
    const orderDate = firstItem?.order?.created_at ? formatDate(firstItem.order.created_at) : formatDate(suratJalan.created_at);
    
    // Departure & Arrival times formatted as HH . mm
    const formatTimeOnly = (dtStr: string | null) => {
        if (!dtStr) return '';
        try {
            const d = new Date(dtStr);
            return `${String(d.getHours()).padStart(2, '0')} . ${String(d.getMinutes()).padStart(2, '0')}`;
        } catch {
            return '';
        }
    };

    const departureTime = formatTimeOnly(suratJalan.departure_time) || '17 . 44';
    const arrivalTime = formatTimeOnly(suratJalan.arrival_time) || '';
    const quantity = Number(firstItem?.quantity_delivered || 7);
    const driverName = suratJalan.driver?.name || suratJalan.driver_name || 'DOWAR';
    const operatorName = firstItem?.work_order?.assigned_user?.name || 'NURDIN';
    const recipientName = firstItem?.recipient_name || '';

    // Mutu extraction (e.g. K 225)
    let mutuCode = '225';
    const prodName = firstItem?.product?.name || '';
    const match = prodName.match(/K[-\s]?(\d+)/i) || (firstItem?.product?.code || '').match(/K[-\s]?(\d+)/i);
    if (match) {
        mutuCode = match[1];
    } else if (prodName) {
        mutuCode = prodName;
    }

    const slumpValue = firstItem?.product?.slump || firstItem?.work_order?.slump_target || '12 ± 2';
    const distanceKm = Number(firstItem?.order?.distance_km || 15);
    const distancePP = distanceKm > 0 ? distanceKm * 2 : 30;

    return (
        <>
            <Head title={`Cetak Nota Pengiriman ${suratJalan.code}`} />

            {/* Screen Actions (Hidden on Print) */}
            <div className="print:hidden bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Cetak Nota Pengiriman &ldquo;Beton Siap Pakai&rdquo;</span>
                    <span className="font-mono text-xs text-slate-400">({suratJalan.code})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 cursor-pointer">
                        <Printer className="size-4" /> Cetak / Unduh PDF
                    </Button>
                </div>
            </div>

            {/* Printable Paper Container */}
            <div className="min-h-screen bg-slate-200/80 p-4 md:p-8 print:p-0 print:bg-white flex justify-center">
                <div className="w-full max-w-[820px] bg-white p-8 md:p-10 shadow-xl print:shadow-none print:p-4 text-black border border-slate-300 print:border-none font-sans text-xs leading-normal">
                    
                    {/* KOP SURAT */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-3">
                        {/* Logo PKM Bulat & Teks Perusahaan */}
                        <div className="flex items-center gap-3">
                            <div className="size-14 rounded-full border-2 border-black flex flex-col items-center justify-center text-center p-1 font-bold leading-none shrink-0">
                                <span className="text-[6px] tracking-tight">&star; PKM &star;</span>
                                <span className="text-[11px] font-black tracking-tighter my-0.5">PKM</span>
                                <span className="text-[5px] uppercase tracking-tighter">Semen Tonasa</span>
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-black tracking-wide text-black uppercase">
                                    PT. PRIMA KARYA MANUNGGAL
                                </h1>
                                <span className="text-[9px] uppercase tracking-widest text-slate-600 block">
                                    Semen Tonasa Group
                                </span>
                            </div>
                        </div>

                        {/* Alamat Kantor Pusat */}
                        <div className="text-right text-[10px] leading-tight text-black">
                            <p className="font-bold">Kantor Pusat PT. Semen Tonasa</p>
                            <p>Lantai I Biringere Pangkep</p>
                            <p>Telp. (0410) 310040 Fax. (0410) 310039</p>
                        </div>
                    </div>

                    {/* KOTAK NOMOR & TANGGAL */}
                    <div className="flex justify-end mt-2 mb-2">
                        <div className="border border-black px-3 py-1.5 text-xs min-w-[200px] leading-snug">
                            <div className="flex items-center justify-between">
                                <span className="font-bold">No :</span>
                                <span className="font-mono font-bold tracking-wider">{suratJalan.code}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-black/40 mt-1 pt-0.5">
                                <span className="font-bold">Tonasa Tgl.</span>
                                <span>{formatDate(suratJalan.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* JUDUL RESMI NOTA PENGIRIMAN */}
                    <div className="text-center my-3">
                        <h2 className="text-base md:text-lg font-black uppercase tracking-wider underline underline-offset-4 decoration-2">
                            NOTA PENGIRIMAN &ldquo;BETON SIAP PAKAI&rdquo;
                        </h2>
                    </div>

                    {/* FORM IDENTITAS PERMINTAAN */}
                    <div className="space-y-1.5 text-xs mt-3">
                        <div className="flex items-end">
                            <span className="w-48 shrink-0">Permintaan dari</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 min-h-[20px]">
                                {customerName}
                            </span>
                        </div>

                        <div className="flex items-end">
                            <span className="w-48 shrink-0">Untuk Pekerjaan</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 min-h-[20px]">
                                {projectTitle}
                            </span>
                        </div>

                        <div className="flex items-end">
                            <span className="w-48 shrink-0">Lokasi Pengecoran</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 min-h-[20px]">
                                {deliveryAddress}
                            </span>
                        </div>

                        <div className="flex items-end pt-0.5">
                            <span className="w-48 shrink-0">Sesuai dengan surat Permintaan No.</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 border-b border-black font-mono font-bold pb-0.5 min-h-[20px]">
                                {orderCode}
                            </span>
                            <span className="px-3 shrink-0">Tgl. :</span>
                            <span className="w-36 border-b border-black font-bold pb-0.5 text-center min-h-[20px]">
                                {orderDate}
                            </span>
                        </div>
                    </div>

                    {/* SECTION: PELAKSANAAN PENGIRIMAN */}
                    <div className="mt-5 mb-2">
                        <h3 className="font-black text-xs uppercase tracking-wide">
                            &ldquo;PELAKSANAAN PENGIRIMAN&rdquo; :
                        </h3>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-start">
                        {/* SISI KIRI: DATA TRUK & WAKTU */}
                        <div className="col-span-8 space-y-2 text-xs">
                            <div className="flex items-end">
                                <span className="w-36 shrink-0">Transit Mixer No.</span>
                                <span className="mr-1">:</span>
                                <span className="w-32 border-b border-black border-dotted font-mono font-black text-sm pb-0.5">
                                    {suratJalan.vehicle_number}
                                </span>
                                <span className="px-2 shrink-0">sebanyak :</span>
                                <span className="w-16 border-b border-black border-dotted font-bold text-center pb-0.5">
                                    {quantity}
                                </span>
                                <span className="pl-1">m3</span>
                            </div>

                            <div className="flex items-end gap-1">
                                <span className="w-44 shrink-0 text-[11px]">Jam selesai muat / jam berangkat</span>
                                <span>:</span>
                                <span className="w-20 border-b border-black border-dotted font-mono font-bold text-center pb-0.5">
                                    {departureTime}
                                </span>
                                <span className="pl-2 w-32 shrink-0 text-[11px]">Jam mulai tuang</span>
                                <span>:</span>
                                <span className="flex-1 border-b border-black border-dotted pb-0.5 min-h-[16px]"></span>
                            </div>

                            <div className="flex items-end gap-1">
                                <span className="w-44 shrink-0 text-[11px]">Jam datang di lokasi pengecoran</span>
                                <span>:</span>
                                <span className="w-20 border-b border-black border-dotted font-mono font-bold text-center pb-0.5">
                                    {arrivalTime || '.........'}
                                </span>
                                <span className="pl-2 w-32 shrink-0 text-[11px]">Jam selesai tuang / kembali</span>
                                <span>:</span>
                                <span className="flex-1 border-b border-black border-dotted pb-0.5 min-h-[16px]"></span>
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                                <span>Sampai saat ini telah dikirim sebanyak :</span>
                                <span className="size-8 rounded-full border-2 border-black flex items-center justify-center font-black text-sm">
                                    {quantity}
                                </span>
                                <span className="font-bold">m3</span>
                            </div>
                        </div>

                        {/* SISI KANAN: ADDECTIVE & MUTU KARAKTERISTIK */}
                        <div className="col-span-4 border border-black p-3 rounded-xs space-y-2.5 text-xs bg-slate-50/40">
                            <div className="flex items-baseline justify-between">
                                <span className="font-bold">ADDECTIVE =</span>
                                <span className="font-mono font-extrabold text-sm border-b border-black border-dotted px-2">8</span>
                                <span className="font-bold">LITER</span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[11px]">Sifat kekuasaan campuran :</span>
                                <span className="font-black text-sm">K</span>
                                <span className="border-2 border-black px-2.5 py-0.5 font-black text-sm tracking-wider bg-white">
                                    {mutuCode}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-bold">Slump :</span>
                                <span className="flex-1 border-b border-black border-dotted font-mono font-bold text-center pb-0.5">
                                    {slumpValue}
                                </span>
                                <span className="font-bold">CM</span>
                            </div>
                        </div>
                    </div>

                    {/* 3 KOLOM TANDA TANGAN BERGARIS TEGAS */}
                    <div className="mt-8 border-2 border-black grid grid-cols-3 divide-x-2 divide-black text-center">
                        <div className="p-3 flex flex-col justify-between min-h-[120px]">
                            <div className="font-bold text-xs leading-tight">
                                Penerima<br />Yang dikuasakan
                            </div>
                            <div className="pt-12 font-bold text-xs">
                                ( {recipientName || '........................................'} )
                            </div>
                        </div>

                        <div className="p-3 flex flex-col justify-between min-h-[120px]">
                            <div className="font-bold text-xs leading-tight">
                                Transit Mixer<br />Operator
                            </div>
                            <div className="pt-12 font-black text-xs uppercase">
                                ( {driverName} )
                            </div>
                        </div>

                        <div className="p-3 flex flex-col justify-between min-h-[120px]">
                            <div className="font-bold text-xs leading-tight">
                                Batch Plant<br />Operator
                            </div>
                            <div className="pt-12 font-black text-xs uppercase">
                                ( {operatorName} )
                            </div>
                        </div>
                    </div>

                    {/* CATATAN & JARAK PP */}
                    <div className="mt-4 text-xs space-y-1">
                        <p className="font-bold">Catatan</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-black tracking-wider">JARAK PP =</span>
                            <span className="border-b border-black border-dotted font-mono font-bold px-3">
                                {distancePP}
                            </span>
                            <span className="font-bold">KM</span>
                            <span className="text-slate-600 italic ml-2">
                                {suratJalan.notes || 'Pengantaran aman armada truk mixer PKM.'}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
