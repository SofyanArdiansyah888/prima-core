import { Head } from '@inertiajs/react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Printer, Building2, Truck, Scale, ShieldCheck } from 'lucide-react';
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
    gross_weight_kg: number | null;
    tare_weight_kg: number | null;
    net_weight_kg: number | null;
    nota_timbangan_number: string | null;
    notes: string | null;
    created_at: string;
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
        order?: { id: number; code: string; po_number: string | null };
        work_order?: { id: number; code: string; batch_recipe_code: string | null };
    }[];
};

export default function DispatchPrint({ suratJalan }: { suratJalan: SuratJalanDetail }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Cetak Surat Jalan ${suratJalan.code}`} />
            
            {/* Screen Actions (Hidden on Print) */}
            <div className="print:hidden bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Dokumen Digital Surat Jalan PKM</span>
                    <span className="font-mono text-xs text-slate-400">({suratJalan.code})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5">
                        <Printer className="size-4" /> Cetak / Unduh PDF
                    </Button>
                </div>
            </div>

            {/* Printable Paper A4 Container */}
            <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white flex justify-center">
                <div className="w-full max-w-4xl bg-white p-8 md:p-12 shadow-lg print:shadow-none print:p-6 text-slate-900 border border-slate-200 print:border-none">
                    
                    {/* Header Kop Surat */}
                    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-wider text-emerald-800 uppercase">
                                    PT PRIMA KARYA MANUNGGAL
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Semen Tonasa Group (SIG) · Divisi Beton & Distribusi Logistik
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {suratJalan.batching_plant.address || 'Kawasan Industri Semen Tonasa, Biringere, Pangkep, Sulawesi Selatan'} · Telp: {suratJalan.batching_plant.phone || '(0410) 21012'}
                            </p>
                        </div>

                        <div className="text-right">
                            <h1 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                                SURAT JALAN PENGANTARAN
                            </h1>
                            <span className="font-mono text-sm font-bold text-emerald-800">{suratJalan.code}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">Tanggal Terbit: {formatDateTime(suratJalan.created_at)}</p>
                        </div>
                    </div>

                    {/* Metadata Dispatch Grid */}
                    <div className="grid grid-cols-2 gap-6 my-5 text-xs">
                        <div className="space-y-1.5 rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                                Asal & Armada Pengangkut
                            </span>
                            <div className="grid grid-cols-3 gap-1 pt-1">
                                <span className="text-slate-500">Plant Asal:</span>
                                <span className="col-span-2 font-semibold">{suratJalan.batching_plant.name}</span>
                                
                                <span className="text-slate-500">Nomor Polisi:</span>
                                <span className="col-span-2 font-mono font-bold">{suratJalan.vehicle_number}</span>

                                <span className="text-slate-500">Tipe Armada:</span>
                                <span className="col-span-2">{suratJalan.vehicle_type}</span>

                                <span className="text-slate-500">Nama Driver:</span>
                                <span className="col-span-2 font-semibold">{suratJalan.driver_name}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                                Data Jembatan Timbang
                            </span>
                            <div className="grid grid-cols-3 gap-1 pt-1">
                                <span className="text-slate-500">No. Timbangan:</span>
                                <span className="col-span-2 font-mono font-semibold">{suratJalan.nota_timbangan_number || 'NT-AUTO-PKM'}</span>

                                <span className="text-slate-500">Gross (Bruto):</span>
                                <span className="col-span-2 font-mono">{Number(suratJalan.gross_weight_kg || 0).toLocaleString('id-ID')} Kg</span>

                                <span className="text-slate-500">Tare (Tara):</span>
                                <span className="col-span-2 font-mono">{Number(suratJalan.tare_weight_kg || 0).toLocaleString('id-ID')} Kg</span>

                                <span className="text-slate-500 font-bold">Netto Muatan:</span>
                                <span className="col-span-2 font-mono font-bold text-emerald-800">{Number(suratJalan.net_weight_kg || 0).toLocaleString('id-ID')} Kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Cargo / Items Table */}
                    <div className="my-6">
                        <table className="w-full text-left text-xs border border-slate-200">
                            <thead className="bg-slate-100 uppercase font-bold text-slate-700 border-b border-slate-200">
                                <tr>
                                    <th className="p-2.5 w-8 text-center border-r border-slate-200">No</th>
                                    <th className="p-2.5 border-r border-slate-200">Penerima & Proyek Tujuan</th>
                                    <th className="p-2.5 border-r border-slate-200">Deskripsi Material / Mutu Beton</th>
                                    <th className="p-2.5 border-r border-slate-200">Ref SO / SPK</th>
                                    <th className="p-2.5 text-right w-24">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {suratJalan.items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="p-2.5 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                                        <td className="p-2.5 border-r border-slate-200">
                                            <p className="font-bold text-slate-900">{item.destination_customer_name}</p>
                                            <p className="text-slate-600 font-medium">{item.destination_project_title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{item.destination_address}</p>
                                        </td>
                                        <td className="p-2.5 border-r border-slate-200">
                                            <p className="font-bold text-slate-900">{item.product.name}</p>
                                            <p className="font-mono text-[11px] text-slate-500">Kode: {item.product.code} {item.product.slump ? `· Slump: ${item.product.slump}` : ''}</p>
                                        </td>
                                        <td className="p-2.5 border-r border-slate-200 font-mono text-[11px]">
                                            <p>SO: {item.order?.code || '—'}</p>
                                            {item.work_order && <p className="text-purple-700">SPK: {item.work_order.code}</p>}
                                        </td>
                                        <td className="p-2.5 text-right font-mono font-bold text-sm">
                                            {Number(item.quantity_delivered)} {item.unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    {suratJalan.notes && (
                        <div className="mb-6 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                            <strong>Catatan Pengiriman:</strong> {suratJalan.notes}
                        </div>
                    )}

                    {/* Signatures 4 Column Box */}
                    <div className="mt-12 grid grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-slate-300">
                        <div>
                            <p className="font-semibold text-slate-600 uppercase text-[10px]">Kepala Batching Plant</p>
                            <div className="h-16 flex items-center justify-center">
                                <span className="font-script text-slate-400 italic text-sm">(Ttd & Cap)</span>
                            </div>
                            <p className="font-bold border-t border-slate-300 pt-1">Manager Produksi PKM</p>
                        </div>

                        <div>
                            <p className="font-semibold text-slate-600 uppercase text-[10px]">Petugas Timbangan</p>
                            <div className="h-16 flex items-center justify-center">
                                <span className="font-script text-slate-400 italic text-sm">(Ttd Valid)</span>
                            </div>
                            <p className="font-bold border-t border-slate-300 pt-1">Operator Timbang</p>
                        </div>

                        <div>
                            <p className="font-semibold text-slate-600 uppercase text-[10px]">Pengemudi / Driver</p>
                            <div className="h-16 flex items-center justify-center">
                                <span className="font-script text-slate-400 italic text-sm">(Ttd Driver)</span>
                            </div>
                            <p className="font-bold border-t border-slate-300 pt-1">{suratJalan.driver_name}</p>
                        </div>

                        <div>
                            <p className="font-semibold text-slate-600 uppercase text-[10px]">Penerima di Proyek</p>
                            <div className="h-16 flex items-center justify-center">
                                <span className="font-script text-slate-400 italic text-sm">(Nama, Ttd & Cap)</span>
                            </div>
                            <p className="font-bold border-t border-slate-300 pt-1">Pelaksana Lapangan</p>
                        </div>
                    </div>

                    {/* Digital Verification Footer */}
                    <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Dokumen ini diterbitkan secara elektronik oleh Sistem ERP PT Prima Karya Manunggal (Tonasa Group).</span>
                        <span>Doc Ref: {suratJalan.uuid.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
