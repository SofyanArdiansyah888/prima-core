import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Layers, 
  Truck, 
  ShoppingCart, 
  CheckCircle2, 
  Sparkles, 
  Box, 
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export default function CalculatorView({ 
  products, 
  calcData, 
  setCalcData, 
  addToCart, 
  setIsCartOpen 
}) {
  const [calcMode, setCalcMode] = useState('slab'); // 'slab', 'column', 'footing'

  // Calculations
  const calcResult = useMemo(() => {
    const waste = (parseFloat(calcData.wasteMargin) || 0) / 100;
    let netVol = 0;

    if (calcMode === 'slab') {
      const l = parseFloat(calcData.length) || 0;
      const w = parseFloat(calcData.width) || 0;
      const t = (parseFloat(calcData.thickness) || 0) / 100;
      netVol = l * w * t;
    } else if (calcMode === 'column') {
      const count = parseFloat(calcData.columnCount) || 1;
      const sideA = (parseFloat(calcData.sideA) || 30) / 100;
      const sideB = (parseFloat(calcData.sideB) || 30) / 100;
      const height = parseFloat(calcData.height) || 3;
      netVol = count * sideA * sideB * height;
    } else if (calcMode === 'footing') {
      const count = parseFloat(calcData.footingCount) || 1;
      const l = (parseFloat(calcData.footingL) || 100) / 100;
      const w = (parseFloat(calcData.footingW) || 100) / 100;
      const d = (parseFloat(calcData.footingD) || 50) / 100;
      netVol = count * l * w * d;
    }

    const grossVol = netVol * (1 + waste);
    // Round to nearest 0.5 m³ (minimum 3m³ order for ready mix)
    const roundedVol = Math.max(3, Math.ceil(grossVol * 2) / 2);

    const selectedProd = products.find(p => p.id === calcData.productId) || products[1];
    const trucksCount = Math.ceil(roundedVol / 7); // 7m³ per mixer truck
    const estCost = roundedVol * selectedProd.price;
    const estPpn = estCost * 0.11;

    return {
      netVol: netVol.toFixed(2),
      grossVol: grossVol.toFixed(2),
      roundedVol: roundedVol,
      trucksCount: trucksCount,
      selectedProd: selectedProd,
      estCost: estCost,
      estPpn: estPpn,
      grandTotal: estCost + estPpn
    };
  }, [calcData, calcMode, products]);

  const handleAddToCart = () => {
    let noteStr = '';
    if (calcMode === 'slab') {
      noteStr = `Kalkulasi Pelat: ${calcData.length}m x ${calcData.width}m x ${calcData.thickness}cm (Waste ${calcData.wasteMargin}%)`;
    } else if (calcMode === 'column') {
      noteStr = `Kalkulasi ${calcData.columnCount || 1} Kolom: ${calcData.sideA}cm x ${calcData.sideB}cm x ${calcData.height}m`;
    } else {
      noteStr = `Kalkulasi ${calcData.footingCount || 1} Pondasi: ${calcData.footingL}cm x ${calcData.footingW}cm x ${calcData.footingD}cm`;
    }

    addToCart(calcResult.selectedProd, calcResult.roundedVol, noteStr);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5 text-brand-600" />
            <span>Kalkulator Presisi PKM</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Kalkulator Kebutuhan Beton & Estimasi Biaya Proyek
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Hitung kubikasi beton (m³) secara akurat sesuai jenis pekerjaan fisik agar penuangan beton efisien tanpa kekurangan material di lapangan.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch md:self-auto flex-shrink-0">
          <button
            onClick={() => setCalcMode('slab')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              calcMode === 'slab' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slab / Pelat Lantai
          </button>
          <button
            onClick={() => setCalcMode('column')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              calcMode === 'column' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kolom / Tiang
          </button>
          <button
            onClick={() => setCalcMode('footing')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              calcMode === 'footing' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pondasi Tapak
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          
          {/* Step 1: Select Concrete Product */}
          <div>
            <label className="block font-extrabold text-slate-800 text-xs mb-2">
              1. Pilih Mutu Beton Ready Mix PKM:
            </label>
            <select
              value={calcData.productId}
              onChange={(e) => setCalcData({ ...calcData, productId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-brand-500 focus:bg-white"
            >
              {products.filter(p => p.category === 'readymix').map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} (Rp {p.price.toLocaleString('id-ID')}/{p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Dimension Inputs based on calcMode */}
          <div className="space-y-3">
            <label className="block font-extrabold text-slate-800 text-xs">
              2. Masukkan Dimensi Area (Meter & Cm):
            </label>

            {calcMode === 'slab' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Panjang (m)</span>
                  <input
                    type="number"
                    value={calcData.length || '10'}
                    onChange={(e) => setCalcData({ ...calcData, length: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Lebar (m)</span>
                  <input
                    type="number"
                    value={calcData.width || '6'}
                    onChange={(e) => setCalcData({ ...calcData, width: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Tebal (cm)</span>
                  <input
                    type="number"
                    value={calcData.thickness || '12'}
                    onChange={(e) => setCalcData({ ...calcData, thickness: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
              </div>
            )}

            {calcMode === 'column' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah Kolom</span>
                  <input
                    type="number"
                    value={calcData.columnCount || '10'}
                    onChange={(e) => setCalcData({ ...calcData, columnCount: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Sisi A (cm)</span>
                  <input
                    type="number"
                    value={calcData.sideA || '30'}
                    onChange={(e) => setCalcData({ ...calcData, sideA: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Sisi B (cm)</span>
                  <input
                    type="number"
                    value={calcData.sideB || '30'}
                    onChange={(e) => setCalcData({ ...calcData, sideB: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Tinggi (m)</span>
                  <input
                    type="number"
                    value={calcData.height || '4'}
                    onChange={(e) => setCalcData({ ...calcData, height: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
              </div>
            )}

            {calcMode === 'footing' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah Pondasi</span>
                  <input
                    type="number"
                    value={calcData.footingCount || '8'}
                    onChange={(e) => setCalcData({ ...calcData, footingCount: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Panjang (cm)</span>
                  <input
                    type="number"
                    value={calcData.footingL || '120'}
                    onChange={(e) => setCalcData({ ...calcData, footingL: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Lebar (cm)</span>
                  <input
                    type="number"
                    value={calcData.footingW || '120'}
                    onChange={(e) => setCalcData({ ...calcData, footingW: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Kedalaman (cm)</span>
                  <input
                    type="number"
                    value={calcData.footingD || '60'}
                    onChange={(e) => setCalcData({ ...calcData, footingD: e.target.value })}
                    className="w-full bg-transparent font-extrabold text-slate-900 text-sm outline-none mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Safety Waste Slider */}
          <div className="bg-brand-50/70 p-4 rounded-xl border border-brand-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-brand-900 flex items-center space-x-1">
                <span>3. Cadangan Safety Waste Beton</span>
                <HelpCircle className="w-3.5 h-3.5 text-brand-600" title="Mengantisipasi tumpahan pada bekisting dan sisa di corong pompa" />
              </span>
              <span className="font-black text-amber-600 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
                +{calcData.wasteMargin || '5'}% Waste
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={calcData.wasteMargin || '5'}
              onChange={(e) => setCalcData({ ...calcData, wasteMargin: e.target.value })}
              className="w-full accent-brand-600 cursor-pointer"
            />
            
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>0% (Presisi)</span>
              <span>5% (Standar Rekomendasi PKM)</span>
              <span>15% (Lokasi Sulit/Rumpun)</span>
            </div>
          </div>

          {/* Visual 2D Box Diagram Representation */}
          <div className="bg-slate-900 text-white p-4 rounded-xl relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Visual 2D Formwork</div>
              <div className="text-xs font-semibold text-slate-300">
                {calcMode === 'slab' && `Slab (${calcData.length || 10}m × ${calcData.width || 6}m × ${calcData.thickness || 12}cm)`}
                {calcMode === 'column' && `${calcData.columnCount || 10} Kolom (${calcData.sideA || 30}cm × ${calcData.sideB || 30}cm × ${calcData.height || 4}m)`}
                {calcMode === 'footing' && `${calcData.footingCount || 8} Pondasi (${calcData.footingL || 120}cm × ${calcData.footingW || 120}cm)`}
              </div>
            </div>

            {/* SVG Illustration */}
            <svg className="w-24 h-16 text-amber-400 stroke-current fill-amber-400/20" viewBox="0 0 100 60">
              <rect x="10" y="15" width="80" height="30" rx="4" strokeWidth="2" />
              <line x1="10" y1="15" x2="30" y2="5" strokeWidth="2" />
              <line x1="90" y1="15" x2="105" y2="5" strokeWidth="2" />
              <line x1="30" y1="5" x2="105" y2="5" strokeWidth="2" />
              <line x1="90" y1="45" x2="105" y2="35" strokeWidth="2" />
              <line x1="105" y1="5" x2="105" y2="35" strokeWidth="2" />
            </svg>
          </div>

        </div>

        {/* Right Calculation Summary (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6 border border-brand-700">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-brand-700 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">
                  Hasil Perhitungan PKM
                </span>
                <h3 className="font-extrabold text-base text-white">Ringkasan Kubikasi</h3>
              </div>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                {calcResult.selectedProd.code}
              </span>
            </div>

            {/* Metric Breakdown */}
            <div className="space-y-3">
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Volume Murni Teoretis:</span>
                <span className="font-bold text-slate-200">{calcResult.netVol} m³</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Volume + Safety Waste ({calcData.wasteMargin || 5}%):</span>
                <span className="font-bold text-slate-200">{calcResult.grossVol} m³</span>
              </div>

              <div className="bg-brand-800/80 p-3.5 rounded-xl border border-amber-500/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase">Volume Rekomendasi Pesan:</div>
                  <div className="text-2xl font-black text-white">
                    {calcResult.roundedVol} <span className="text-sm font-extrabold text-amber-400">m³</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-300 font-semibold">Estimasi Truck Mixer:</div>
                  <div className="text-sm font-extrabold text-white flex items-center justify-end space-x-1">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>{calcResult.trucksCount} Armada (7m³)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-brand-700/60 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Harga Beton ({calcResult.roundedVol} m³):</span>
                  <span className="font-bold">Rp {calcResult.estCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Estimasi PPN 11%:</span>
                  <span>Rp {calcResult.estPpn.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-400 pt-2 border-t border-brand-700">
                  <span>Grand Total Tagihan:</span>
                  <span>Rp {calcResult.grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2 pt-4">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-brand-950 font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-glow transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Masukkan Hasil Ke Keranjang ({calcResult.roundedVol} m³)</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center font-medium">
              * Minimum order Ready Mix adalah 3 m³. Gratis biaya konsultasi penuangan dari teknisi PKM.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
