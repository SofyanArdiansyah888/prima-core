import React, { useState } from 'react';
import { Smartphone, Download, X, CheckCircle2 } from 'lucide-react';

export default function PWABanner({ triggerToast }) {
  const [visible, setVisible] = useState(true);
  const [installed, setInstalled] = useState(false);

  if (!visible) return null;

  const handleInstall = () => {
    setInstalled(true);
    triggerToast("Aplikasi PWA PT PKM berhasil dipasang di Layar Utama HP!");
    setTimeout(() => setVisible(false), 3000);
  };

  return (
    <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-4 py-2 text-xs border-b border-amber-500/30 sticky top-[72px] z-30 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-brand-950 p-1 rounded-lg">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-brand-950 font-extrabold px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider">
                PWA Mobile App
              </span>
              <span className="font-bold text-slate-100 text-xs">
                Pasang Aplikasi Toko PKM & Lacak Pengiriman Beton dari HP Anda
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block">
              Akses lebih cepat tanpa install via Play Store, offline order mode & live push notification driver.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {!installed ? (
            <button 
              onClick={handleInstall}
              className="bg-amber-500 hover:bg-amber-400 text-brand-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang PWA</span>
            </button>
          ) : (
            <span className="bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terpasang</span>
            </span>
          )}

          <button 
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
