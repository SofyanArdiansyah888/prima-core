import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  PhoneCall,
  Thermometer,
  Activity,
  FileText,
  Building,
  RotateCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function TrackingView({
  orders,
  setActiveTab,
  setSelectedDocOrder
}) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [mapTruckProgress, setMapTruckProgress] = useState(65); // percentage along route

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  // Animated truck movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMapTruckProgress(prev => (prev >= 95 ? 20 : prev + 0.5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!activeOrder) {
    return (
      <div className="bg-white p-12 rounded-2xl text-center space-y-3 border border-slate-200">
        <Truck className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">Belum Ada Pesanan Aktif</h3>
        <p className="text-xs text-slate-400">Silakan buat pesanan baru melalui katalog produk PKM.</p>
        <button
          onClick={() => setActiveTab('catalog')}
          className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Lihat Katalog Produk
        </button>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Dikonfirmasi', time: '09:15 WITA' },
    { num: 2, label: 'Batching Plant', time: '10:20 WITA' },
    { num: 3, label: 'Armada Di Jalan', time: '10:45 WITA' },
    { num: 4, label: 'Tiba di Lokasi', time: activeOrder.estimatedArrival },
    { num: 5, label: 'Pengecoran Selesai', time: 'Dokumen Terbit' },
  ];

  return (
    <div className="space-y-6">

      {/* Header Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Telematics & Live Dispatch Simulator</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Pelacakan Real-Time Armada Mixer & Pengiriman Beton
          </h2>
          <p className="text-xs text-slate-500">
            Pantau pergerakan truk mixer dari Batching Plant PKM langsung ke koordinat proyek Anda.
          </p>
        </div>

        {/* Order Dropdown Picker */}
        <div className="w-full md:w-auto">
          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Pilih Nomor Invoice:</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-xl p-2.5 outline-none focus:border-brand-500"
          >
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.projectTitle.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Status Timeline + Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Delivery Status & Truck Telematics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Order Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="bg-brand-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase">Nomor Pesanan PKM</span>
                <div className="text-base font-black tracking-wide text-white">{activeOrder.id}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${activeOrder.statusStep === 5 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-brand-950 animate-pulse'
                }`}>
                {activeOrder.statusStep === 5 ? 'Selesai' : 'Dalam Pengiriman'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Proyek Pelanggan:</span>
                <div className="font-bold text-slate-900">{activeOrder.clientName}</div>
                <div className="text-slate-600 text-[11px] font-medium">{activeOrder.projectTitle}</div>
              </div>

              <div className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-[11px] font-medium">{activeOrder.projectAddress}</span>
              </div>
            </div>

            {/* Step Progress Timeline */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Tahapan Status Pengiriman
              </span>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {steps.map((step) => {
                  const isDone = activeOrder.statusStep >= step.num;
                  const isCurrent = activeOrder.statusStep === step.num;
                  return (
                    <div key={step.num} className="relative flex items-center justify-between text-xs">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {isDone ? '✓' : step.num}
                      </div>

                      <span className={`font-bold ${isCurrent ? 'text-amber-600 text-sm' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">{step.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



        </div>

        {/* Right Column: Interactive Live Route Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-brand-600" />
                <span>Peta Rute & Titik Koordinat GPS</span>
              </h3>
              <p className="text-xs text-slate-500">
                Posisi saat ini: <span className="font-bold text-brand-700">{activeOrder.telematics.currentLocationName}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimasi Tiba:</span>
              <span className="font-black text-brand-600 text-sm">{activeOrder.estimatedArrival}</span>
            </div>
          </div>

          {/* SVG Simulated Interactive Map Container */}
          <div className="relative w-full h-[400px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">

            {/* Map Canvas Illustration */}
            <svg className="w-full h-full object-cover" viewBox="0 0 600 400">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Map Grid */}
              <rect width="600" height="400" fill="#0f172a" />
              <rect width="600" height="400" fill="url(#grid)" />

              {/* Topographic Land Contour Lines */}
              <path d="M 50 100 Q 150 40 250 120 T 450 80 T 580 180" fill="none" stroke="#1e293b" strokeWidth="3" />
              <path d="M 20 280 Q 180 340 320 260 T 550 320" fill="none" stroke="#1e293b" strokeWidth="3" />

              {/* Waterway / Coastal line */}
              <path d="M 0 350 Q 200 320 400 380 L 600 400 L 0 400 Z" fill="#0369a1" opacity="0.3" />

              {/* Road Path (Batching Plant to Site) */}
              <path
                id="deliveryPath"
                d="M 80 80 Q 200 120 300 220 T 500 300"
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="6"
                strokeDasharray="8 4"
              />

              {/* Start Pin: Batching Plant Pangkep */}
              <g transform="translate(80, 80)">
                <circle r="16" fill="#1d4ed8" opacity="0.3" />
                <circle r="10" fill="#1d4ed8" />
                <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">PLANT</text>
                <rect x="-60" y="-35" width="120" height="20" rx="4" fill="#0f2c59" stroke="#3b82f6" strokeWidth="1" />
                <text x="0" y="-22" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Plant PKM Pangkep</text>
              </g>

              {/* End Pin: Project Location */}
              <g transform="translate(500, 300)">
                <circle r="20" fill="#10b981" opacity="0.3" />
                <circle r="12" fill="#10b981" />
                <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">SITE</text>
                <rect x="-70" y="20" width="140" height="22" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="0" y="34" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Lokasi Proyek Bontoa</text>
              </g>

              {/* Moving Truck Mixer Marker */}
              <g transform={`translate(${80 + (420 * mapTruckProgress / 100)}, ${80 + (220 * mapTruckProgress / 100)})`}>
                <circle r="24" fill="#f59e0b" opacity="0.35" className="animate-ping" />
                <rect x="-18" y="-14" width="36" height="28" rx="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" fill="#0f2c59" fontSize="12" fontWeight="900" textAnchor="middle">🚚</text>

                {/* Truck Badge Floating */}
                <g transform="translate(0, -25)">
                  <rect x="-55" y="-12" width="110" height="18" rx="4" fill="#0f2c59" stroke="#f59e0b" strokeWidth="1" />
                  <text x="0" y="0" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                    DD 8912 PKM ({Math.round(mapTruckProgress)}%)
                  </text>
                </g>
              </g>
            </svg>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-3 left-3 right-3 bg-brand-950/90 backdrop-blur-md p-3 rounded-xl border border-brand-700 text-white flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold text-slate-200">Sinyal Telematik GPS: Stabil (4G LTE)</span>
              </div>
              <span className="font-extrabold text-amber-400 text-[11px]">
                Kecepatan Rata-rata 42 km/h
              </span>
            </div>

          </div>

          {/* Quick Details Below Map */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Item Terkirim:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {activeOrder.items.map(i => `${i.quantity} ${i.unit} ${i.code}`).join(' + ')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Metode Bayar:</span>
              <div className="font-bold text-brand-700 mt-0.5">{activeOrder.paymentMethod}</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
