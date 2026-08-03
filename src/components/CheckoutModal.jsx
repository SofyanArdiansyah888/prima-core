import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  X, 
  Truck, 
  Navigation,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  cart, 
  b2bPartner, 
  onPlaceOrder, 
  triggerToast 
}) {
  if (!isOpen) return null;

  const [projectTitle, setProjectTitle] = useState('Proyek Perumahan Green Minasa - Blok B4');
  const [projectAddress, setProjectAddress] = useState('Jl. Poros Tonasa II, Bontoa, Kab. Pangkep');
  const [selectedPlant, setSelectedPlant] = useState('plant-pangkep');
  const [deliveryDate, setDeliveryDate] = useState('2026-08-05');
  const [timeSlot, setTimeSlot] = useState('Pagi (08:00 - 12:00 WITA)');
  const [paymentMethod, setPaymentMethod] = useState('VA_BANK'); // 'B2B_CREDIT', 'VA_BANK' — Tahap 1 fokus direct customer via VA
  const [selectedBank, setSelectedBank] = useState('Bank Mandiri');
  const [poNumber, setPoNumber] = useState('PO-MKU/PKM/2026/089');
  const [slumpReq, setSlumpReq] = useState('12 ± 2 cm');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const ppn = subtotal * 0.11;
  const grandTotal = subtotal + ppn;

  const availableCredit = b2bPartner.creditLimit - b2bPartner.creditUsed;

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (paymentMethod === 'B2B_CREDIT' && grandTotal > availableCredit) {
      triggerToast("Error: Total tagihan melebihi sisa limit kredit B2B Anda.");
      return;
    }

    const newOrderId = `INV-PKM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrderObj = {
      id: newOrderId,
      orderDate: new Date().toLocaleString('id-ID'),
      deliveryDate: deliveryDate,
      deliveryTimeSlot: timeSlot,
      clientName: b2bPartner.companyName,
      clientType: b2bPartner.partnerTier,
      projectTitle: projectTitle,
      projectAddress: projectAddress,
      pinpointCoords: { lat: -4.805, lng: 119.561 },
      items: [...cart],
      subtotal: subtotal,
      ppn: ppn,
      totalPrice: grandTotal,
      paymentMethod: paymentMethod === 'B2B_CREDIT' ? 'Kredit B2B (TOP 30 Hari PKM)' : `Virtual Account (${selectedBank})`,
      paymentStatus: paymentMethod === 'B2B_CREDIT' ? 'APPROVED_CREDIT' : 'PENDING_VA',
      poNumber: poNumber || 'N/A',
      statusStep: 1,
      statusText: 'Pesanan Telah Dikonfirmasi & Masuk Antrean Batching Plant',
      plantAssigned: selectedPlant === 'plant-pangkep' ? 'Batching Plant Utama - Pangkep' : 'Batching Plant Cabang Makassar (KIMA)',
      mixerTruckNumber: 'DD 8912 PKM (Mixer #04 - 7m³)',
      driverName: 'Pak Syamsuddin (ID: DRV-089)',
      driverPhone: '0812-4112-9901',
      estimatedArrival: '11:45 WITA',
      telematics: {
        speedKm: 0,
        drumRotationRpm: 4,
        concreteTempC: 30.5,
        slumpValue: slumpReq,
        batchTime: 'Baru Saja',
        currentLocationName: 'Batching Plant PKM (Persiapan Loading)'
      },
      digitalDocs: {
        suratJalanNumber: `SJ-PKM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        notaTimbanganNumber: `NT-PKM-${Math.floor(1000 + Math.random() * 9000)}`,
        grossWeightKg: 28500,
        tareWeightKg: 11200,
        netWeightKg: 17300,
        eFakturNumber: `010.003-26.${Math.floor(10000000 + Math.random() * 90000000)}`,
        qualityCertNumber: `CERT-TONASA-${Math.floor(1000 + Math.random() * 9000)}`
      }
    };

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onPlaceOrder(newOrderObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-brand-900 text-white p-5 flex justify-between items-center border-b border-brand-700">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">Konfirmasi Pemesanan & Lokasi Proyek</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-6 space-y-5 text-xs">
          
          {/* Section 1: Project Information & Pinpoint */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>1. Informasi Proyek & Titik Lokasi Pengiriman</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama / Judul Proyek:</label>
                <input 
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Batching Plant Terdekat:</label>
                <select 
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-brand-500"
                >
                  <option value="plant-pangkep">Batching Plant Utama - Pangkep (Semen Tonasa)</option>
                  <option value="plant-makassar">Batching Plant Cabang Makassar (KIMA)</option>
                  <option value="plant-maros">Batching Plant Support - Maros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Penuangan (Pinpoint GPS):</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 font-medium text-slate-800 outline-none focus:border-brand-500"
                />
                <Navigation className="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Section 2: Pouring Schedule & Technical Specs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>2. Jadwal Penuangan & Permintaan Spesifikasi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Kirim:</label>
                <input 
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Jam Kirim:</label>
                <select 
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-brand-500"
                >
                  <option>Pagi (08:00 - 12:00 WITA)</option>
                  <option>Siang (13:00 - 17:00 WITA)</option>
                  <option>Malam / Lembur (20:00+ WITA)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Permintaan Nilai Slump:</label>
                <select 
                  value={slumpReq}
                  onChange={(e) => setSlumpReq(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-brand-500"
                >
                  <option>10 ± 2 cm (Struktur Rigid)</option>
                  <option>12 ± 2 cm (Standar Penuangan)</option>
                  <option>14 ± 2 cm (Penuangan Pompa Tinggi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>3. Metode Pembayaran & Syarat Kemitraan</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
            {/* Option B: Virtual Account — DEFAULT Tahap 1 */}
              <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'VA_BANK' 
                  ? 'border-brand-600 bg-brand-50/70 shadow-sm' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="payMethod"
                      checked={paymentMethod === 'VA_BANK'}
                      onChange={() => setPaymentMethod('VA_BANK')}
                      className="accent-brand-600"
                    />
                    <span className="font-extrabold text-slate-900">Virtual Account / Transfer Bank</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-300">TERSEDIA</span>
                  </div>
                  <Building className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-[10px] text-slate-500 ml-5">
                  Pembayaran langsung via VA Bank Mandiri, BRI, BNI, BCA.
                </p>
              </label>

              {/* Option A: B2B TOP Credit — Tahap 2 */}
              <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'B2B_CREDIT' 
                  ? 'border-brand-600 bg-brand-50/70 shadow-sm' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="payMethod"
                      checked={paymentMethod === 'B2B_CREDIT'}
                      onChange={() => setPaymentMethod('B2B_CREDIT')}
                      className="accent-brand-600"
                    />
                    <span className="font-extrabold text-brand-900">Kredit B2B (TOP 30 Hari PKM)</span>
                    <span className="bg-brand-100 text-brand-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-brand-300">TAHAP 2</span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500 ml-5">
                  Gunakan plafond kredit B2B korporat. Sisa limit: <span className="font-bold text-emerald-700">Rp {availableCredit.toLocaleString('id-ID')}</span>
                </p>
              </label>

            </div>

            {paymentMethod === 'B2B_CREDIT' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Nomor Purchase Order (PO) Korporat:</label>
                <input 
                  type="text"
                  required
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-MKU/PKM/2026/089"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold outline-none"
                />
              </div>
            )}

            {paymentMethod === 'VA_BANK' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Pilih Bank Virtual Account:</label>
                <select 
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-xs outline-none"
                >
                  <option>Bank Mandiri (VA PKM)</option>
                  <option>BRI (Bank Rakyat Indonesia)</option>
                  <option>BNI (Bank Negara Indonesia)</option>
                  <option>BCA (Bank Central Asia)</option>
                </select>
              </div>
            )}

          </div>

          {/* Bottom Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Pembayaran:</span>
              <div className="text-lg font-black text-brand-600">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-brand-950 font-black rounded-xl text-xs flex items-center space-x-2 shadow-glow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Buat Pesanan Sekarang</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
