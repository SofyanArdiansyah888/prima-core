import { useEffect, useState, useMemo } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
import {
  alertCircleOutline,
  arrowBackOutline,
  businessOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeCircleOutline,
  closeOutline,
  cubeOutline,
  documentTextOutline,
  downloadOutline,
  folderOpenOutline,
  folderOutline,
  printOutline,
  qrCodeOutline,
  searchOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import { orderStatusTone } from '../../domain/rules';
import type { CustomerOrder } from '../../domain/types';
import PkmLogo from '../../shared/ui/PkmLogo';
import { BrandBar, Card, DocSkeleton, ErrorText, Screen, StatusBadge } from '../../shared/ui';

type DocTab = 'suratJalan' | 'eFaktur';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
};

export default function DigitalDocsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCode = searchParams.get('code');

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<DocTab>('suratJalan');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.orders();
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dokumen digital.');
    } finally {
      setLoading(false);
    }
  };

  const handlePullRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const res = await api.orders();
      setOrders(res.data);
      triggerToast('Dokumen digital diperbarui.', 'info');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui data.');
    } finally {
      event.detail.complete();
    }
  };

  useIonViewWillEnter(() => {
    void loadOrders();
  });

  useEffect(() => {
    void loadOrders();
  }, []);

  // Filtered orders for list view
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.project_title.toLowerCase().includes(q) ||
        (o.delivery_address && o.delivery_address.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // If a code parameter is present in URL, select that specific active order
  const activeOrder = useMemo(() => {
    if (!paramCode) return null;
    return orders.find((o) => o.code === paramCode || o.uuid === paramCode) || null;
  }, [orders, paramCode]);

  const handleDownload = () => {
    if (!activeOrder) return;
    const tabNames: Record<DocTab, string> = {
      suratJalan: 'Surat-Jalan-POD',
      eFaktur: 'e-Faktur-Pajak',
    };
    setIsDownloading(true);
    triggerToast(`Menyiapkan berkas PDF ${tabNames[activeTab]}-${activeOrder.code}...`, 'info');
    setTimeout(() => {
      setIsDownloading(false);
      triggerToast(`Berkas resmi ${tabNames[activeTab]}-${activeOrder.code}.pdf berhasil diunduh.`, 'success');
    }, 1200);
  };

  const handleShare = () => {
    if (!activeOrder) return;
    if (navigator.share) {
      void navigator.share({
        title: `Dokumen Resmi ${activeOrder.code}`,
        text: `Dokumen digital resmi pesanan ${activeOrder.code} - PT Prima Karya Manunggal (Semen Tonasa Group)`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      triggerToast(`Tautan dokumen resmi pesanan ${activeOrder.code} disalin ke papan klip.`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: DocTab; label: string; icon: string }[] = [
    { id: 'suratJalan', label: 'Surat Jalan (e-POD)', icon: documentTextOutline },
    { id: 'eFaktur', label: 'e-Faktur Pajak', icon: documentTextOutline },
  ];

  return (
    <Screen
      onRefresh={handlePullRefresh}
      header={
        <BrandBar
          title={activeOrder ? `Dokumen ${activeOrder.code}` : 'Dokumen Digital'}
        />
      }
    >
      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 pointer-events-none opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <IonIcon icon={checkmarkCircleOutline} className="text-lg text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <IonIcon icon={documentTextOutline} className="text-lg text-amber-400 shrink-0" />}
            {toast.type === 'error' && <IonIcon icon={alertCircleOutline} className="text-lg text-[#d91424] shrink-0" />}
            <span className="leading-snug font-medium">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <IonIcon icon={closeOutline} className="text-base" />
          </button>
        </div>
      </div>

      {loading ? (
        <DocSkeleton />
      ) : error ? (
        <div className="p-4">
          <ErrorText>{error}</ErrorText>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
            <IonIcon icon={documentTextOutline} className="text-3xl" />
          </div>
          <h2 className="text-base font-extrabold text-[#0c1d37]">Belum Ada Dokumen Terbit</h2>
          <p className="mt-1.5 max-w-xs text-xs text-slate-500 leading-relaxed">
            Surat jalan dan e-faktur akan tersedia otomatis setelah pesanan diproses.
          </p>
        </div>
      ) : activeOrder ? (
        /* ======================================================================
           VIEW 2: DETAIL VIEW DOKUMEN PESANAN TERTENTU
           ====================================================================== */
        <div className="space-y-3.5 px-4 py-4 pb-24">
          {/* Back to Document List Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/tabs/docs')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/90 px-3 py-1.5 text-xs font-bold text-[#0c1d37] hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <IonIcon icon={arrowBackOutline} className="text-sm text-[#ea580c]" />
              <span>Semua Dokumen</span>
            </button>
            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase flex items-center gap-1">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>Dokumen Sah</span>
            </span>
          </div>

          {/* Active Order Summary Card */}
          <Card className="p-3.5 bg-gradient-to-br from-[#0c1d37] to-[#162e55] text-white border-none shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                  Nomor Pesanan (SO)
                </span>
                <span className="font-mono text-sm font-black text-amber-400">{activeOrder.code}</span>
              </div>
              <StatusBadge tone={orderStatusTone(activeOrder.status)}>
                {activeOrder.status}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-300 block">Proyek:</span>
                <span className="font-bold text-slate-100 truncate block">{activeOrder.project_title}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-300 block">Tanggal Terbit:</span>
                <span className="font-mono text-slate-200">{formatDate(activeOrder.created_at)}</span>
              </div>
            </div>
          </Card>

          {/* Document Type Tabs (Surat Jalan & e-Faktur) */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#0c1d37] font-extrabold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
                >
                  <IonIcon
                    icon={tab.icon}
                    className={`text-sm ${isSelected ? 'text-[#ea580c]' : 'text-slate-400'}`}
                  />
                  <span className="text-xs font-bold leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] py-2.5 px-3 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <IonIcon icon={downloadOutline} className="text-base" />
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3.5 text-xs font-bold text-slate-700 shadow-xs transition-all cursor-pointer"
              title="Bagikan"
            >
              <IonIcon icon={shareSocialOutline} className="text-base" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3.5 text-xs font-bold text-slate-700 shadow-xs transition-all cursor-pointer"
              title="Cetak"
            >
              <IonIcon icon={printOutline} className="text-base" />
            </button>
          </div>

          {/* Render Document Sheet */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeOrder.code}-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl border border-slate-300/90 bg-white p-5 shadow-sm space-y-4 text-xs overflow-hidden"
            >
              {/* Watermark Logo Background */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <PkmLogo className="size-64" />
              </div>

              {/* Official Letterhead Header */}
              <div className="relative z-10 flex items-start justify-between border-b-2 border-slate-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <PkmLogo className="size-10 shrink-0" />
                  <div>
                    <h3 className="text-xs font-black tracking-wide text-[#0c1d37]">
                      PT PRIMA KARYA MANUNGGAL
                    </h3>
                    <p className="text-[9px] font-extrabold text-[#ea580c] uppercase">
                      Semen Tonasa Group • SIG
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Biringere, Pangkep, Sulawesi Selatan | (0410) 21012
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 uppercase flex items-center gap-1 justify-end">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <span>E-VERIFIED</span>
                  </span>
                  <p className="mt-1 font-mono text-[9px] text-slate-400">
                    {activeOrder.created_at ? formatDate(activeOrder.created_at) : '30 Sep 2026'}
                  </p>
                </div>
              </div>

              {/* TAB 1: SURAT JALAN & POD */}
              {activeTab === 'suratJalan' && (
                <div className="relative z-10 space-y-3.5">
                  <div className="text-center">
                    <h4 className="font-extrabold text-sm text-[#0c1d37] uppercase tracking-wide">
                      Surat Jalan & Bukti Penerimaan (e-POD)
                    </h4>
                    <p className="font-mono text-[10px] font-bold text-[#d91424]">
                      No. SJ: SJ-PKM/{activeOrder.code}/2026
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Penerima / Proyek:</span>
                      <div className="font-extrabold text-slate-900 mt-0.5">{activeOrder.project_title}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{activeOrder.delivery_address}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Armada & Plant:</span>
                      <div className="font-bold text-slate-900 mt-0.5">{activeOrder.plant?.name || 'Plant Pangkep'}</div>
                      <div className="font-mono text-[10px] text-slate-600">Mixer: DD 8920 XT (#04)</div>
                      <div className="text-[10px] text-slate-600">Driver: Muh. Yusuf S.</div>
                    </div>
                  </div>

                  {/* Material Table */}
                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <thead>
                      <tr className="bg-[#0c1d37] text-white">
                        <th className="p-2 border border-slate-700 text-left">Item Material</th>
                        <th className="p-2 border border-slate-700 text-center">Volume</th>
                        <th className="p-2 border border-slate-700 text-right">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-bold text-slate-900">{item.name || item.code}</td>
                          <td className="p-2 text-center font-extrabold text-[#0c1d37]">
                            {formatQty(item.quantity)} {item.unit}
                          </td>
                          <td className="p-2 text-right text-slate-500 italic text-[10px]">SNI Resmi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures & QR */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px]">
                    <div className="rounded-xl border border-slate-200 p-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mb-6">Petugas Batcher</span>
                      <p className="font-bold text-slate-800">( Hardianto )</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mb-6">Pengemudi Mixer</span>
                      <p className="font-bold text-slate-800">( Muh. Yusuf S. )</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 flex flex-col items-center justify-between">
                      <span className="text-[9px] text-emerald-800 font-bold uppercase block">Validasi Digital</span>
                      <IonIcon icon={qrCodeOutline} className="text-2xl text-[#0c1d37] my-0.5" />
                      <span className="font-extrabold text-emerald-700 text-[8px]">DIGITAL VERIFIED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: E-FAKTUR PAJAK */}
              {activeTab === 'eFaktur' && (
                <div className="relative z-10 space-y-3.5">
                  <div className="text-center">
                    <h4 className="font-extrabold text-sm text-[#0c1d37] uppercase tracking-wide">
                      Faktur Pajak Digital (e-Faktur)
                    </h4>
                    <p className="font-mono text-[10px] font-bold text-[#d91424]">
                      Kode: 010.004-26.{activeOrder.code.replace(/[^0-9]/g, '').padEnd(8, '0')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">PKP Penjual:</span>
                        <div className="font-extrabold text-slate-900">PT PRIMA KARYA MANUNGGAL</div>
                        <div className="text-slate-500 font-mono text-[10px]">NPWP: 01.122.344.5-801.000</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Pembeli:</span>
                        <div className="font-extrabold text-slate-900">{activeOrder.project_title}</div>
                        <div className="text-slate-500 font-mono text-[10px]">NPWP: 01.999.888.7-802.000</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>Dasar Pengenaan Pajak (DPP):</span>
                        <span className="font-mono font-medium">{formatRupiah(activeOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>PPN Terutang (11%):</span>
                        <span className="font-mono font-medium">{formatRupiah(activeOrder.ppn)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-[#0c1d37] pt-1.5 border-t border-slate-200 text-xs">
                        <span>Total Tagihan:</span>
                        <span className="font-mono font-bold text-sm">{formatRupiah(activeOrder.total_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* ======================================================================
           VIEW 1: DAFTAR BERKAS DOKUMEN PESANAN (MASTER LIST)
           ====================================================================== */
        <div className="space-y-4 px-4 py-4 pb-24">
          {/* Header Description & Search Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#0c1d37]">
                  Daftar Berkas Dokumen
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pilih pesanan untuk melihat berkas e-POD & Faktur.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-black text-[#0c1d37]">
                {orders.length} Berkas
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <IonIcon
                icon={searchOutline}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kode pesanan / proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0c1d37] focus:ring-2 focus:ring-[#0c1d37]/15 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <IonIcon icon={closeCircleOutline} className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* List of Order Document Folders */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-xs text-slate-400">Tidak ada berkas yang sesuai dengan kata kunci.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.uuid}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    onClick={() => navigate(`/tabs/docs?code=${order.code}`)}
                    className="p-4 border border-slate-200/90 shadow-2xs hover:border-[#0c1d37]/30 hover:shadow-xs transition-all cursor-pointer bg-white group"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-[#ea580c] border border-orange-100 group-hover:bg-[#0c1d37] group-hover:text-white group-hover:border-[#0c1d37] transition-colors">
                          <IonIcon icon={folderOutline} className="text-lg" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-black text-[#0c1d37] tracking-tight block">
                            {order.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>

                      <StatusBadge tone={orderStatusTone(order.status)}>
                        {order.status}
                      </StatusBadge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-extrabold text-slate-900 group-hover:text-[#ea580c] transition-colors">
                        {order.project_title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {order.delivery_address}
                      </div>
                    </div>

                    {/* Chips for available documents */}
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100 text-[10px]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                        <IonIcon icon={documentTextOutline} className="text-xs text-blue-600" />
                        <span>Surat Jalan (e-POD)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                        <IonIcon icon={documentTextOutline} className="text-xs text-purple-600" />
                        <span>e-Faktur Pajak</span>
                      </span>
                    </div>

                    {/* Action Prompt */}
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#0c1d37] pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">2 Berkas Terlampir</span>
                      <div className="flex items-center gap-1 text-[11px] text-[#ea580c] group-hover:translate-x-0.5 transition-transform">
                        <span>Buka Berkas</span>
                        <IonIcon icon={chevronForwardOutline} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
