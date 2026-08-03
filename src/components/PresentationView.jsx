import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles, 
  Layers, 
  Calculator, 
  Truck, 
  FileText, 
  Building2, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Presentation
} from 'lucide-react';

export default function PresentationView({ setActiveTab, setPortalMode }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const slides = [
    {
      id: 1,
      tag: 'PENDAHULUAN & PROFIL',
      title: 'Digitalisasi Penjualan & Operasional',
      subtitle: 'PT Prima Karya Manunggal (PKM) — Anak Perusahaan PT Semen Tonasa',
      bgClass: 'bg-gradient-to-br from-slate-900 via-brand-900 to-brand-950',
      content: (
        <div className="space-y-6 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-black">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Semen Tonasa Group (SIG)</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
            Konsep & Alur Bisnis Aplikasi Penjualan Produk PKM
          </h1>

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Solusi platform digital terpadu untuk memudahkan pemesanan beton curah (<span className="text-amber-400 font-bold">Ready Mix</span>), material pertambangan (<span className="text-amber-400 font-bold">Pasir & Batu Split</span>), produk cetakan (<span className="text-amber-400 font-bold">Precast</span>), hingga penyewaan pompa beton secara langsung, transparan, dan efisien.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
            <div className="bg-brand-900/90 p-3.5 rounded-2xl border border-brand-700">
              <span className="text-amber-400 font-black text-xs block">01. Ready Mix</span>
              <span className="text-slate-300 text-[11px] font-medium">Beton Mutu K-100 s/d K-500</span>
            </div>
            <div className="bg-brand-900/90 p-3.5 rounded-2xl border border-brand-700">
              <span className="text-amber-400 font-black text-xs block">02. Pertambangan</span>
              <span className="text-slate-300 text-[11px] font-medium">Pasir Tambang & Batu Split</span>
            </div>
            <div className="bg-brand-900/90 p-3.5 rounded-2xl border border-brand-700">
              <span className="text-amber-400 font-black text-xs block">03. Precast</span>
              <span className="text-slate-300 text-[11px] font-medium">Paving Block & Kanstin</span>
            </div>
            <div className="bg-brand-900/90 p-3.5 rounded-2xl border border-brand-700">
              <span className="text-amber-400 font-black text-xs block">04. Sewa Alat</span>
              <span className="text-slate-300 text-[11px] font-medium">Concrete Pump Boom</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      tag: 'ARSITEKTUR SISTEM',
      title: '2 Pilar Utama Sistem Aplikasi PKM',
      subtitle: 'Memisahkan Portal Pembeli dengan Pusat Komando Pabrik',
      bgClass: 'bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {/* Pilar 1: Sisi Pembeli */}
          <div className="bg-brand-900/90 rounded-2xl p-6 border border-brand-700 text-white space-y-4 shadow-lg">
            <div className="flex items-center space-x-3 border-b border-brand-700 pb-3">
              <div className="w-10 h-10 bg-amber-500 text-brand-950 rounded-xl flex items-center justify-center font-black text-lg">
                📱
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">1. Portal Pelanggan / Toko Online</h3>
                <span className="text-[11px] text-amber-300 font-medium">Untuk Konsumen Ritel & Pembeli Direct</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Katalog Lengkap Produk Ready Mix, Material & Sewa Alat</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Kalkulator Kubikasi Beton Otomatis (+ Safety Waste Slider)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Pemilihan Titik Pinpoint Lokasi Proyek & Jam Kirim</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Pelacakan Mobil Molen secara Live (GPS Telematics)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Download e-Surat Jalan, Nota Timbangan & e-Faktur</span>
              </li>
            </ul>
          </div>

          {/* Pilar 2: Sisi Internal Admin */}
          <div className="bg-brand-900/90 rounded-2xl p-6 border border-brand-700 text-white space-y-4 shadow-lg">
            <div className="flex items-center space-x-3 border-b border-brand-700 pb-3">
              <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center font-black text-lg">
                🛠️
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">2. Dashboard Operasional Pabrik</h3>
                <span className="text-[11px] text-amber-300 font-medium">Pusat Komando Tim Internal PKM</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Ringkasan Produksi Beton Harian & Total Omzet</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Monitoring Stok Silo Semen Tonasa, Pasir & Batu Split</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Manajemen Penugasan Mobil Molen (Dispatcher)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Verifikasi Pembayaran & Rincian Pesanan Masuk</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Grafik Output Jam-demi-Jam Pabrik Batching Plant</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      tag: 'ALUR PENJUALAN',
      title: '5 Langkah Mudah Pemesanan Pembeli',
      subtitle: 'Proses sederhana dari memilih produk hingga terima beton di lokasi proyek',
      bgClass: 'bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-white text-xs">
            {[
              { num: '01', title: 'Pilih Produk', desc: 'Mutu beton K-100 s/d K-500, pasir, split atau sewa pompa.', icon: Layers },
              { num: '02', title: 'Hitung Volume', desc: 'Gunakan kalkulator kubikasi agar pas tanpa sisa.', icon: Calculator },
              { num: '03', title: 'Lokasi & Bayar', desc: 'Pilih titik lokasi proyek & bayar via Virtual Account.', icon: MapPin },
              { num: '04', title: 'Lacak Live GPS', desc: 'Pantau posisi mobil molen yang sedang di jalan.', icon: Truck },
              { num: '05', title: 'Dokumen Digital', desc: 'Download Surat Jalan & e-Faktur di HP.', icon: FileText },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-brand-900/90 p-4 rounded-2xl border border-brand-700 space-y-2 flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-amber-500 text-brand-950 font-black text-[10px] px-2 py-0.5 rounded">
                        Langkah {step.num}
                      </span>
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <h4 className="font-extrabold text-white text-sm">{step.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-brand-950/80 p-4 rounded-2xl border border-amber-500/40 text-center text-xs text-slate-300">
            <span className="font-bold text-amber-400">💡 Keunggulan Utama:</span> Seluruh alur berlangsung transparan tanpa pembeli perlu bolak-balik telepon ke kantor pabrik.
          </div>
        </div>
      )
    },
    {
      id: 4,
      tag: 'FITUR UNGGULAN #1',
      title: 'Kalkulator Volume Beton Interaktif',
      subtitle: 'Mencegah pembeli kekurangan atau kelebihan material saat pengecoran',
      bgClass: 'bg-gradient-to-br from-brand-900 via-slate-900 to-brand-950',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full text-white text-xs">
          <div className="space-y-3 bg-brand-900/90 p-5 rounded-2xl border border-brand-700 shadow-lg">
            <h3 className="font-black text-base text-amber-400">Cara Kerja Kalkulator:</h3>
            <ul className="space-y-2.5 text-slate-300 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-amber-400">1.</span>
                <span><strong>Masukkan Dimensi:</strong> Pembeli menginput ukuran area (Panjang × Lebar × Tebal cm) untuk Pelat Lantai, Kolom, atau Pondasi.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-amber-400">2.</span>
                <span><strong>Safety Waste Slider:</strong> Pembeli menggeser slider cadangan safety waste (0% - 15%) untuk mengantisipasi tumpahan pada bekisting.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-amber-400">3.</span>
                <span><strong>Hasil Otomatis:</strong> Sistem langsung menghitung total m³ beton, jumlah armada truk mixer (misal: 2 truk @ 7m³), dan estimasi total biaya + PPN 11%.</span>
              </li>
            </ul>
          </div>

          <div className="bg-brand-950 p-5 rounded-2xl border border-brand-700 space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase">Contoh Hasil Perhitungan</span>
              <div className="bg-brand-900 p-3.5 rounded-xl border border-brand-700">
                <div className="text-slate-400 text-[10px]">Ukuran Pelat Lantai: 10m × 6m × 12cm</div>
                <div className="text-xl font-black text-amber-400 mt-1">7.5 m³ Ready Mix K-300</div>
                <div className="text-xs text-slate-200 mt-0.5">Membutuhkan 2 Armada Truk Mixer (7m³)</div>
              </div>
            </div>

            <button
              onClick={() => {
                setPortalMode('client');
                setActiveTab('calculator');
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-brand-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-glow"
            >
              <Calculator className="w-4 h-4" />
              <span>Coba Kalkulator Beton Live →</span>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 5,
      tag: 'FITUR UNGGULAN #2',
      title: 'Pelacakan Live GPS & Sensor Telematika',
      subtitle: 'Memantau posisi mobil truk molen dari pabrik hingga tiba di lokasi proyek',
      bgClass: 'bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950',
      content: (
        <div className="space-y-5 max-w-4xl mx-auto w-full text-white text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-brand-900/90 p-4 rounded-2xl border border-brand-700 shadow-md">
              <span className="text-amber-400 font-bold text-xs block mb-1">📍 Peta GPS Live</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Ikon mobil molen bergerak di peta mengikuti rute dari Batching Plant Pangkep/Makassar ke titik proyek.</p>
            </div>
            <div className="bg-brand-900/90 p-4 rounded-2xl border border-brand-700 shadow-md">
              <span className="text-emerald-400 font-bold text-xs block mb-1">🔄 Sensor Drum & Suhu</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Memantau kecepatan putaran drum molen (RPM), suhu adonan beton (°C), dan sertifikat slump.</p>
            </div>
            <div className="bg-brand-900/90 p-4 rounded-2xl border border-brand-700 shadow-md">
              <span className="text-amber-400 font-bold text-xs block mb-1">📞 Kontak Driver & ETA</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Informasi plat truk (misal DD 8912 PKM), nama sopir Pak Syamsuddin, dan estimasi jam tiba di lokasi.</p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setPortalMode('client');
                setActiveTab('tracking');
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl border border-brand-400/30 inline-flex items-center space-x-2 shadow-md"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Buka Tampilan Lacak Pengiriman Live →</span>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 6,
      tag: 'ALUR INTERNAL PABRIK',
      title: 'Proses Kerja Tim Batching Plant PKM',
      subtitle: 'Pengendalian stok bahan baku dan penugasan armada pengiriman',
      bgClass: 'bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900',
      content: (
        <div className="space-y-5 max-w-4xl mx-auto w-full text-white text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-brand-900/90 p-5 rounded-2xl border border-brand-700 space-y-2 shadow-md">
              <span className="text-amber-400 font-black text-xs uppercase">Step A. Penerimaan Order</span>
              <h4 className="font-extrabold text-white text-sm">Masuk Ke Sistem Dispatcher</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Order pembeli yang telah dibayar akan langsung muncul di Dashboard Operator Pabrik.
              </p>
            </div>

            <div className="bg-brand-900/90 p-5 rounded-2xl border border-brand-700 space-y-2 shadow-md">
              <span className="text-amber-400 font-black text-xs uppercase">Step B. Penugasan Truk</span>
              <h4 className="font-extrabold text-white text-sm">Assign Truk Mixer & Sopir</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Petugas menunjuk armada truk molen yang siap di yard (misal Mixer #04) dan menerbitkan Surat Jalan Digital.
              </p>
            </div>

            <div className="bg-brand-900/90 p-5 rounded-2xl border border-brand-700 space-y-2 shadow-md">
              <span className="text-amber-400 font-black text-xs uppercase">Step C. Pengadukan & Pengisian</span>
              <h4 className="font-extrabold text-white text-sm">Loading Silo & Keberangkatan</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Beton cair dimuat dari silo Semen Tonasa & agregat pasir/split, lalu truk berangkat menuju lokasi proyek.
              </p>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setPortalMode('admin');
                setActiveTab('catalog');
              }}
              className="bg-amber-500 hover:bg-amber-400 text-brand-950 font-black text-xs px-5 py-2.5 rounded-xl inline-flex items-center space-x-2 shadow-glow"
            >
              <Building2 className="w-4 h-4" />
              <span>Buka Dashboard Operasional Pabrik →</span>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 7,
      tag: 'TAHAPAN PENGEMBANGAN',
      title: 'Rencana Peluncuran & Integrasi Lanjutan',
      subtitle: 'Fokus awal pada kemudahan transaksi direct customer & operasional plant',
      bgClass: 'bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full text-white text-xs">
          
          <div className="bg-emerald-950/90 p-6 rounded-2xl border border-emerald-500/40 space-y-3 shadow-lg">
            <span className="bg-emerald-500 text-white font-black px-2.5 py-1 rounded text-[10px] uppercase">
              TAHAP 1 (FOKUS SAAT INI)
            </span>
            <h3 className="font-extrabold text-base text-white">Digitalisasi Toko Online & Operasional Plant</h3>
            <ul className="space-y-2 text-slate-300 list-disc pl-4">
              <li>Katalog Produk Ready Mix, Material & Sewa Alat</li>
              <li>Kalkulator Kubikasi Beton Presisi</li>
              <li>Pemesanan Direct Customer & Pembayaran Virtual Account</li>
              <li>Live Telematics GPS Tracking Truk Mixer</li>
              <li>Surat Jalan & Nota Timbangan Digital</li>
              <li>Dashboard Pengendalian Stok Silo & Dispatcher Truk</li>
            </ul>
          </div>

          <div className="bg-brand-900/90 p-6 rounded-2xl border border-brand-700 space-y-3 shadow-lg">
            <span className="bg-brand-600 text-white font-black px-2.5 py-1 rounded text-[10px] uppercase">
              TAHAP 2 (MENDATANG)
            </span>
            <h3 className="font-extrabold text-base text-white">Pengembangan Fitur Lanjutan</h3>
            <ul className="space-y-2 text-slate-300 list-disc pl-4">
              <li>Sistem Pembayaran Kredit TOP Khusus Mitra Korporat B2B</li>
              <li>Integrasi ERP Internal Perusahaan</li>
              <li>Analitik Prediksi Kebutuhan Stok Bahan Baku</li>
            </ul>
          </div>

        </div>
      )
    }
  ];

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isAutoPlay) {
      timer = setInterval(() => {
        setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0));
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  const activeSlideData = slides[currentSlide];

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Slide Presentation Canvas Container */}
      <div className={`relative min-h-[520px] rounded-3xl ${activeSlideData.bgClass} text-white p-6 md:p-10 shadow-2xl border border-brand-700 overflow-hidden flex flex-col justify-between transition-all duration-300`}>
        
        {/* Slide Top Navigation Info Bar */}
        <div className="flex justify-between items-center border-b border-brand-700 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white text-brand-900 rounded-xl font-black text-sm flex items-center justify-center border-2 border-amber-400">
              PKM
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">
                {activeSlideData.tag}
              </span>
              <h2 className="font-extrabold text-white text-sm md:text-base leading-tight">
                {activeSlideData.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-brand-900/90 text-amber-300 px-3.5 py-1 rounded-full font-extrabold border border-amber-500/40">
              Slide {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Dynamic Slide Content Body */}
        <div className="py-4 flex-grow flex items-center justify-center">
          {activeSlideData.content}
        </div>

        {/* Slide Bottom Controls */}
        <div className="pt-4 border-t border-brand-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs mt-4">
          
          {/* Progress Indicators */}
          <div className="flex items-center space-x-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-brand-800 hover:bg-slate-700'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all ${
                isAutoPlay ? 'bg-amber-500 text-brand-950 shadow-glow' : 'bg-brand-900 text-white hover:bg-brand-800 border border-brand-700'
              }`}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoPlay ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="p-2 bg-brand-900 hover:bg-brand-800 text-white disabled:opacity-30 rounded-xl border border-brand-700 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-2 bg-amber-500 hover:bg-amber-400 text-brand-950 disabled:opacity-30 rounded-xl font-black transition-all shadow-glow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
