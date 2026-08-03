import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building, 
  CreditCard, 
  FileCheck, 
  Clock, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign,
  UserCheck
} from 'lucide-react';

export default function B2BProfileView({ partner, triggerToast }) {
  const [activeSubTab, setActiveSubTab] = useState('credit'); // 'credit', 'po', 'contracts'
  const [poFileSelected, setPoFileSelected] = useState(null);

  const availableCredit = partner.creditLimit - partner.creditUsed;
  const creditUsagePercent = Math.round((partner.creditUsed / partner.creditLimit) * 100);

  const handlePoUpload = (e) => {
    e.preventDefault();
    if (!poFileSelected) {
      triggerToast("Pilih file Purchase Order (PO) terlebih dahulu.");
      return;
    }
    triggerToast(`Purchase Order (${poFileSelected}) berhasil diunggah ke portal PKM!`);
    setPoFileSelected(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-brand-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/10 border-2 border-amber-400 rounded-2xl flex items-center justify-center font-black text-amber-400 text-xl backdrop-blur-md flex-shrink-0">
            B2B
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-brand-950 font-black px-2.5 py-0.5 rounded text-[10px] uppercase">
                {partner.partnerTier}
              </span>
              <span className="text-slate-300 text-xs font-semibold">NPWP: {partner.npwp}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              {partner.companyName}
            </h2>
            <p className="text-slate-300 text-xs font-medium mt-0.5">
              PIC: {partner.contactPerson} | {partner.email}
            </p>
          </div>
        </div>

        <button 
          onClick={() => triggerToast("Data Kemitraan B2B Tersinkronisasi dengan ERP PKM!")}
          className="bg-amber-500 hover:bg-amber-400 text-brand-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-glow self-stretch md:self-auto justify-center transition-all"
        >
          <UserCheck className="w-4 h-4" />
          <span>Sinkronkan Status ERP</span>
        </button>
      </div>

      {/* Credit Gauge & Term of Payment Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Credit Gauge (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Fasilitas Kredit Korporat PKM
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">Plafond & Limit Kredit B2B</h3>
            </div>
            <span className="bg-brand-50 text-brand-700 font-extrabold text-xs px-3 py-1 rounded-lg border border-brand-200">
              TOP {partner.topDays} Hari
            </span>
          </div>

          {/* Credit Progress Gauge Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Penggunaan Kredit ({creditUsagePercent}%):</span>
              <span className="text-brand-700">Rp {(partner.creditUsed / 1000000).toLocaleString('id-ID')} Juta</span>
            </div>

            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="bg-gradient-to-r from-amber-500 to-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${creditUsagePercent}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Terpakai: Rp {(partner.creditUsed / 1000000).toLocaleString('id-ID')} Juta</span>
              <span>Total Plafond: Rp {(partner.creditLimit / 1000000).toLocaleString('id-ID')} Juta</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase block">Sisa Limit Kredit Tersedia</span>
              <div className="text-xl font-black text-emerald-700">
                Rp {availableCredit.toLocaleString('id-ID')}
              </div>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* Right Quick PO Upload & Contract Details (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Upload Purchase Order (PO) Proyek
          </h3>
          <p className="text-xs text-slate-500">
            Mitra B2B dapat mengunggah dokumen PO resmi untuk mempercepat proses pembuatan delivery order Ready Mix.
          </p>

          <form onSubmit={handlePoUpload} className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 p-4 rounded-xl text-center bg-slate-50 cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-brand-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-700 block">Pilih File PDF Purchase Order</span>
              <span className="text-[10px] text-slate-400 block">Maksimal ukuran file 10MB</span>
              <input 
                type="file" 
                accept=".pdf,.png,.jpg"
                onChange={(e) => setPoFileSelected(e.target.files[0]?.name || null)}
                className="hidden" 
                id="po-upload-input"
              />
              <label htmlFor="po-upload-input" className="mt-2 inline-block bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 px-3 py-1 rounded-lg cursor-pointer">
                {poFileSelected || 'Browse File...'}
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>Kirim PO Ke Tim Sales PKM</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
