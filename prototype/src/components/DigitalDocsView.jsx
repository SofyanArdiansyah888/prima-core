import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  Building2, 
  Scale, 
  Award, 
  ShieldCheck,
  Calendar,
  User,
  Share2
} from 'lucide-react';

export default function DigitalDocsView({ order, triggerToast }) {
  const [activeDocTab, setActiveDocTab] = useState('suratJalan'); // 'suratJalan', 'notaTimbangan', 'eFaktur', 'sertifikatMutu'

  if (!order) {
    return (
      <div className="bg-white p-12 rounded-2xl text-center space-y-3 border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">Tidak Ada Dokumen Yang Dipilih</h3>
        <p className="text-xs text-slate-400">Silakan pilih pesanan di halaman Lacak Pengiriman untuk melihat dokumen digital.</p>
      </div>
    );
  }

  const handleDownload = (docName) => {
    triggerToast(`Mengunduh ${docName} PDF (${order.id})...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Dokumen Digital Resmi PT PKM</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Berkas & Sertifikasi Digital — {order.id}
          </h2>
          <p className="text-xs text-slate-500">
            Tersedia e-Faktur Pajak, Surat Jalan, Nota Timbangan jembatan, dan Sertifikat Mutu Beton Tonasa.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownload(activeDocTab)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Document Tab Navigation */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'suratJalan', label: 'Surat Jalan Digital (POD)', icon: FileText },
          { id: 'notaTimbangan', label: 'Nota Timbangan', icon: Scale },
          { id: 'eFaktur', label: 'e-Faktur Pajak', icon: Building2 },
          { id: 'sertifikatMutu', label: 'Sertifikat Mutu Beton', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeDocTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDocTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-xl space-y-6 print:border-none print:shadow-none font-sans">
        
        {/* Document Header Logo & Company Info */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-brand-600 text-white rounded-xl font-black text-xl flex items-center justify-center border-2 border-amber-400">
              PKM
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-brand-900 tracking-tight">
                PT PRIMA KARYA MANUNGGAL
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Anak Perusahaan PT Semen Tonasa (SIG / Semen Indonesia Group)
              </p>
              <p className="text-[10px] text-slate-400">
                Kawasan Pabrik Semen Tonasa, Biringere, Pangkep, Sulawesi Selatan | Telp: (0410) 21012
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="bg-brand-50 border border-brand-200 text-brand-900 text-xs font-extrabold px-3 py-1 rounded-lg inline-block">
              TERVERIFIKASI DIGITAL
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Timestamp: {order.orderDate}
            </div>
          </div>
        </div>

        {/* TAB 1: SURAT JALAN DIGITAL */}
        {activeDocTab === 'suratJalan' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                SURAT JALAN & PROOF OF DELIVERY (POD)
              </h3>
              <p className="text-xs text-brand-700 font-mono font-bold">
                No: {order.digitalDocs.suratJalanNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Penerima / Kontraktor:</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{order.clientName}</div>
                <div className="text-slate-600 mt-1">{order.projectAddress}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Asal Pengiriman:</span>
                <div className="font-bold text-slate-900 mt-0.5">{order.plantAssigned}</div>
                <div className="text-slate-600 mt-1">Armada: {order.mixerTruckNumber}</div>
                <div className="text-slate-600 font-semibold">Driver: {order.driverName}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-brand-900 text-white font-extrabold">
                  <th className="p-3 border border-slate-700">Kode & Nama Material</th>
                  <th className="p-3 border border-slate-700 text-center">Mutu / Slump</th>
                  <th className="p-3 border border-slate-700 text-center">Volume (m³)</th>
                  <th className="p-3 border border-slate-700 text-right">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3 text-center text-slate-700">{item.code} ({order.telematics.slumpValue})</td>
                    <td className="p-3 text-center font-extrabold text-brand-700">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-right text-slate-500 italic">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures & Verification */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
              <div className="border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-8">Petugas Batching Plant</span>
                <div className="font-bold text-slate-900">( Hardianto - Batcher )</div>
              </div>
              <div className="border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-8">Pengemudi / Driver Mixer</span>
                <div className="font-bold text-slate-900">( {order.driverName} )</div>
              </div>
              <div className="border border-slate-200 p-3 rounded-xl bg-slate-50 flex flex-col items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanda Tangan Digital Penerima</span>
                <QrCode className="w-12 h-12 text-slate-800 my-1" />
                <div className="font-bold text-emerald-700 text-[10px]">Telah Ditandatangani GPS Verified</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NOTA TIMBANGAN DIGITAL */}
        {activeDocTab === 'notaTimbangan' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                NOTA TIMBANGAN DIGITAL (WEIGHBRIDGE SLIP)
              </h3>
              <p className="text-xs text-brand-700 font-mono font-bold">
                No Tiket: {order.digitalDocs.notaTimbanganNumber}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Berat Bruto (Gross)</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {order.digitalDocs.grossWeightKg.toLocaleString('id-ID')} <span className="text-xs">kg</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Berat Tara (Kosong Truck)</span>
                <div className="text-xl font-black text-slate-700 mt-1">
                  {order.digitalDocs.tareWeightKg.toLocaleString('id-ID')} <span className="text-xs">kg</span>
                </div>
              </div>

              <div className="bg-brand-900 text-white p-4 rounded-xl border border-brand-700">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase">Berat Netto Material</span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {order.digitalDocs.netWeightKg.toLocaleString('id-ID')} <span className="text-xs text-white">kg</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Kalibrasi Jembatan Timbang Metrologi Legalisasi OK</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Timbangan otomatis telah dikalibrasi oleh Badan Metrologi Legal Kementerian Perdagangan RI.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: E-FAKTUR PAJAK */}
        {activeDocTab === 'e-Faktur' || activeDocTab === 'eFaktur' ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                FAKTUR PAJAK DIGITAL (e-Faktur Pajak RI)
              </h3>
              <p className="text-xs text-brand-700 font-mono font-bold">
                Kode Faktur: {order.digitalDocs.eFakturNumber}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pengusaha Kena Pajak (PKP):</span>
                  <div className="font-extrabold text-slate-900">PT PRIMA KARYA MANUNGGAL</div>
                  <div className="text-slate-600 font-mono text-[11px]">NPWP: 01.122.344.5-801.000</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pembeli Barang / Jasa:</span>
                  <div className="font-extrabold text-slate-900">{order.clientName}</div>
                  <div className="text-slate-600 font-mono text-[11px]">NPWP: 01.345.678.9-801.000</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Harga Jual Total (DPP):</span>
                  <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN Terutang (11%):</span>
                  <span>Rp {order.ppn.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-brand-700 text-sm pt-2 border-t border-slate-200">
                  <span>Total Tagihan e-Faktur:</span>
                  <span>Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB 4: SERTIFIKAT MUTU BETON */}
        {activeDocTab === 'sertifikatMutu' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                SERTIFIKAT MUTU BETON READY MIX (QUALITY CERTIFICATE)
              </h3>
              <p className="text-xs text-brand-700 font-mono font-bold">
                No Registrasi: {order.digitalDocs.qualityCertNumber}
              </p>
            </div>

            <div className="bg-brand-50 border border-brand-200 p-5 rounded-2xl text-xs space-y-4">
              <div className="flex justify-between items-center border-b border-brand-200 pb-3">
                <div>
                  <span className="text-[10px] text-brand-700 font-bold uppercase">Hasil Pengujian Laboratorium QC</span>
                  <div className="text-base font-extrabold text-brand-900">Semen Tonasa QC & Research Center</div>
                </div>
                <Award className="w-8 h-8 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-brand-200">
                  <span className="text-[10px] text-slate-400 font-bold">Kuat Tekan Rencana</span>
                  <div className="text-sm font-extrabold text-brand-700 mt-1">{order.items[0]?.code} (24.9 MPa)</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-brand-200">
                  <span className="text-[10px] text-slate-400 font-bold">Hasil Uji 7 Hari</span>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">18.2 MPa (73%)</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-brand-200">
                  <span className="text-[10px] text-slate-400 font-bold">Hasil Uji 28 Hari</span>
                  <div className="text-sm font-extrabold text-emerald-600 mt-1">26.4 MPa (106% PASS)</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-brand-200">
                  <span className="text-[10px] text-slate-400 font-bold">Semen Digunakan</span>
                  <div className="text-xs font-bold text-slate-800 mt-1">Semen Tonasa Type I</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
