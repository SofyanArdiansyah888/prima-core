import React from 'react';
import { 
  Building2, 
  ShoppingCart, 
  ShieldCheck, 
  Layers, 
  Truck, 
  Calculator, 
  FileText, 
  LayoutDashboard, 
  UserCheck,
  ChevronRight,
  Tv,
  Presentation
} from 'lucide-react';

export default function Header({ 
  portalMode, 
  setPortalMode, 
  activeTab, 
  setActiveTab, 
  cartCount, 
  setIsCartOpen
}) {
  return (
    <header className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-800 text-white shadow-xl sticky top-0 z-40 border-b border-brand-600/40">
      
      {/* Top Bar for Mode Switching & Slide Presentation Toggle */}
      <div className="bg-brand-950/80 backdrop-blur-md px-4 py-1.5 text-xs border-b border-brand-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-red-200">
          <span className="bg-gradient-to-r from-brand-600 to-brand-500 text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-widest uppercase border border-brand-400/50 shadow">
            🇮🇩 SIG Group
          </span>
          <span className="font-medium text-[11px] hidden sm:inline text-red-100/80">
            PT Prima Karya Manunggal — Anak Perusahaan PT Semen Tonasa
          </span>
        </div>

        {/* Mode & Slide Presentation Selector */}
        <div className="flex items-center space-x-2">
          
          <button
            onClick={() => setActiveTab('presentation')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
              activeTab === 'presentation'
                ? 'bg-amber-500 text-brand-950 border-amber-400 shadow-md'
                : 'bg-brand-950/80 text-amber-300 border-amber-500/40 hover:bg-brand-800'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>📊 Slide Presentasi Alur Bisnis</span>
          </button>

          <div className="flex items-center bg-brand-950/80 p-0.5 rounded-lg border border-brand-700">
            <button
              onClick={() => {
                setPortalMode('client');
                if (activeTab === 'presentation') setActiveTab('catalog');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                portalMode === 'client' && activeTab !== 'presentation'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Toko Pelanggan</span>
            </button>
            
            <button
              onClick={() => {
                setPortalMode('admin');
                if (activeTab === 'presentation') setActiveTab('catalog');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                portalMode === 'admin' && activeTab !== 'presentation'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard Admin</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => {
            setPortalMode('client');
            setActiveTab('catalog');
          }}
        >
          <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-amber-400 group-hover:scale-105 transition-transform">
            <span className="font-black text-brand-700 text-base tracking-tighter">PKM</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base leading-tight text-white tracking-wide">
                PRIMA KARYA MANUNGGAL
              </h1>
            </div>
            <p className="text-[11px] text-amber-300 font-semibold tracking-wide flex items-center gap-1">
              <span>Ready Mix, Material & Sewa Alat</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-3">
          
          {/* Cart Button */}
          {portalMode === 'client' && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-brand-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-glow transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 && (
                <span className="bg-brand-900 text-amber-400 font-black text-[11px] px-2 py-0.5 rounded-full border border-amber-400 shadow">
                  {cartCount}
                </span>
              )}
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
