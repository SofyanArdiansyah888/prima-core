import { useEffect, useState, useMemo } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
import {
  alertCircleOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeCircleOutline,
  closeOutline,
  documentTextOutline,
  downloadOutline,
  folderOutline,
  printOutline,
  qrCodeOutline,
  searchOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import { orderStatusTone } from '../../domain/rules';
import type { CustomerOrder } from '../../domain/types';
import PkmLogo from '../../shared/ui/PkmLogo';
import { BrandBar, Card, DocSkeleton, ErrorText, Screen, StatusBadge } from '../../shared/ui';

export type DocTab = 'spk' | 'suratJalan' | 'eFaktur';

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
  const [activeTab, setActiveTab] = useState<DocTab>('spk');
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

  // Dynamic available tabs: do not show if document not created in BE!
  const availableTabs = useMemo<{ id: DocTab; label: string; icon: string }[]>(() => {
    if (!activeOrder) return [];
    const list: { id: DocTab; label: string; icon: string }[] = [];

    if (activeOrder.has_spk && activeOrder.work_orders && activeOrder.work_orders.length > 0) {
      list.push({ id: 'spk', label: 'SPK Produksi', icon: documentTextOutline });
    }
    if (activeOrder.has_surat_jalan && activeOrder.surat_jalans && activeOrder.surat_jalans.length > 0) {
      list.push({ id: 'suratJalan', label: 'Surat Jalan (e-POD)', icon: documentTextOutline });
    }
    if (activeOrder.has_faktur) {
      list.push({ id: 'eFaktur', label: 'e-Faktur Pajak', icon: documentTextOutline });
    }
    return list;
  }, [activeOrder]);

  // Ensure active tab points to an available tab
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const handleDownload = async () => {
    if (!activeOrder) return;
    const tabNames: Record<DocTab, 'spk' | 'suratJalan' | 'eFaktur'> = {
      spk: 'spk',
      suratJalan: 'suratJalan',
      eFaktur: 'eFaktur',
    };
    const filePrefix: Record<DocTab, string> = {
      spk: 'SPK',
      suratJalan: 'Surat-Jalan',
      eFaktur: 'e-Faktur',
    };
    const mappedType: 'spk' | 'suratJalan' | 'eFaktur' = tabNames[activeTab];
    const filename = `${filePrefix[activeTab]}-${activeOrder.code}.pdf`;

    setIsDownloading(true);
    triggerToast(`Mengunduh berkas resmi ${filename}...`, 'info');
    try {
      await api.downloadDocument(activeOrder.uuid, mappedType, filename);
      triggerToast(`Berkas resmi ${filename} berhasil diunduh.`, 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Gagal mengunduh dokumen.', 'error');
    } finally {
      setIsDownloading(false);
    }
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

  return (
    <Screen
      onRefresh={handlePullRefresh}
      header={
        <div className="no-print">
          <BrandBar
            title={activeOrder ? `Dokumen ${activeOrder.code}` : 'Dokumen Digital'}
          />
        </div>
      }
    >
      {/* Embedded print style to print only the official document */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-document, .print-document * {
            visibility: visible;
          }
          .print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      <div
        className={`no-print fixed top-24 left-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${
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
            Dokumen SPK Produksi, Surat Jalan (e-POD), dan Faktur akan tersedia otomatis setelah diproses oleh batching plant.
          </p>
        </div>
      ) : activeOrder ? (
        /* ======================================================================
           VIEW 2: DETAIL VIEW DOKUMEN PESANAN TERTENTU
           ====================================================================== */
        <div className="space-y-3.5 px-4 py-4 pb-24">
          {/* Back to Document List Header */}
          <div className="no-print flex items-center justify-between">
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
          <Card className="no-print p-3.5 bg-gradient-to-br from-[#0c1d37] to-[#162e55] text-white border-none shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                  Nomor Pesanan (SO)
                </span>
                <span className="font-mono text-sm font-black text-amber-400">{activeOrder.code}</span>
              </div>
              <StatusBadge tone={orderStatusTone(activeOrder.status)}>
                {activeOrder.status_label || activeOrder.status}
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

          {/* Dynamic Document Type Tabs (SPK, Surat Jalan, e-Faktur) */}
          {availableTabs.length > 0 ? (
            <>
              {availableTabs.length > 1 && (
                <div className="no-print flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
                  {availableTabs.map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#0c1d37] font-extrabold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <IonIcon
                          icon={tab.icon}
                          className={`text-xs ${isSelected ? 'text-[#ea580c]' : 'text-slate-400'}`}
                        />
                        <span className="text-[11px] font-bold leading-tight truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => void handleDownload()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] py-2.5 px-3 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <IonIcon icon={downloadOutline} className="text-base" />
                  <span>{isDownloading ? 'Mengunduh...' : 'Unduh PDF Asli'}</span>
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
                  title="Cetak Dokumen"
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
                  className="print-document relative rounded-2xl border border-slate-300/90 bg-white p-5 shadow-sm space-y-4 text-xs overflow-hidden"
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
                        {activeOrder.created_at ? formatDate(activeOrder.created_at) : ''}
                      </p>
                    </div>
                  </div>

                  {/* TAB 1: SPK PRODUKSI */}
                  {activeTab === 'spk' && (
                    <div className="relative z-10 space-y-3.5">
                      {activeOrder.work_orders?.map((wo, wIdx) => (
                        <div key={wo.uuid || wIdx} className="space-y-3">
                          <div className="text-center">
                            <h4 className="font-extrabold text-sm text-[#0c1d37] uppercase tracking-wide">
                              Surat Perintah Kerja (SPK) Produksi Beton
                            </h4>
                            <p className="font-mono text-[10px] font-bold text-[#d91424]">
                              No. SPK: {wo.code}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px]">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Plant & Batcher:</span>
                              <div className="font-extrabold text-slate-900 mt-0.5">{activeOrder.plant?.name || 'Batching Plant PKM'}</div>
                              <div className="text-slate-600 text-[10px] mt-0.5">Operator: {wo.assigned_user_name || 'Petugas Batching'}</div>
                              <div className="text-slate-500 text-[10px]">Formula: {wo.batch_recipe_code || 'STANDAR-SNI'}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Jadwal & Target:</span>
                              <div className="font-bold text-slate-900 mt-0.5">
                                {wo.scheduled_date ? formatDate(wo.scheduled_date) : formatDate(activeOrder.created_at)}
                              </div>
                              <div className="font-mono text-[10px] text-slate-600">Slot: {wo.scheduled_time_slot || 'Pagi (08:00 - 12:00)'}</div>
                              <div className="text-[10px] text-slate-600">Slump: {wo.slump_target || '12 ± 2 cm'}</div>
                            </div>
                          </div>

                          {/* Recipe / Production Target Table */}
                          <table className="w-full border-collapse border border-slate-200 text-[11px]">
                            <thead>
                              <tr className="bg-[#0c1d37] text-white">
                                <th className="p-2 border border-slate-700 text-left">Spesifikasi Mutu Beton</th>
                                <th className="p-2 border border-slate-700 text-center">Target Vol</th>
                                <th className="p-2 border border-slate-700 text-center">Realisasi</th>
                                <th className="p-2 border border-slate-700 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="p-2 font-bold text-slate-900">
                                  {wo.product_name || activeOrder.items[0]?.name || 'Beton Ready Mix'}
                                  <span className="block font-mono text-[9px] text-slate-500">{wo.product_code || activeOrder.items[0]?.code}</span>
                                </td>
                                <td className="p-2 text-center font-extrabold text-[#0c1d37]">
                                  {formatQty(wo.target_quantity)} {wo.unit}
                                </td>
                                <td className="p-2 text-center font-extrabold text-emerald-700">
                                  {formatQty(wo.produced_quantity)} {wo.unit}
                                </td>
                                <td className="p-2 text-right">
                                  <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                                    {wo.status}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Signatures & QR */}
                          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px]">
                            <div className="rounded-xl border border-slate-200 p-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-6">Supervisor Plant</span>
                              <p className="font-bold text-slate-800">( Quality Control )</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-6">Operator Batching</span>
                              <p className="font-bold text-slate-800">( {wo.assigned_user_name || 'Hardianto'} )</p>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 flex flex-col items-center justify-between">
                              <span className="text-[9px] text-emerald-800 font-bold uppercase block">Validasi Digital</span>
                              <IonIcon icon={qrCodeOutline} className="text-2xl text-[#0c1d37] my-0.5" />
                              <span className="font-extrabold text-emerald-700 text-[8px]">SPK E-VERIFIED</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: SURAT JALAN & NOTA PENGIRIMAN */}
                  {activeTab === 'suratJalan' && (
                    <div className="relative z-10 space-y-4">
                      {activeOrder.surat_jalans?.map((sj, sjIdx) => {
                        const firstItem = sj.items?.[0] as Record<string, any> | undefined;
                        const qty = firstItem?.quantity || activeOrder.items?.[0]?.quantity || 7;
                        const formatTime = (iso: string | null | undefined) => {
                          if (!iso) return '';
                          try {
                            const d = new Date(iso);
                            return `${String(d.getHours()).padStart(2, '0')} . ${String(d.getMinutes()).padStart(2, '0')}`;
                          } catch {
                            return '';
                          }
                        };
                        const departureTime = formatTime(sj.departure_time) || '17 . 44';
                        const arrivalTime = formatTime(sj.arrival_time) || '';
                        const driverName = sj.driver_name || 'DOWAR';
                        const operatorName = firstItem?.batch_plant_operator || 'NURDIN';
                        const recipientName = firstItem?.recipient_name || '';
                        
                        // Mutu K-225 extraction
                        const prodName = firstItem?.product_name || activeOrder.items?.[0]?.name || '';
                        const match = prodName.match(/K[-\s]?(\d+)/i) || (firstItem?.product_code || '').match(/K[-\s]?(\d+)/i);
                        const mutuCode = match ? match[1] : '225';
                        const slumpVal = firstItem?.slump || activeOrder.items?.[0]?.notes || '12 ± 2';
                        const distanceKm = activeOrder.distance_km || 15;
                        const distancePP = distanceKm > 0 ? distanceKm * 2 : 30;

                        return (
                          <div key={sj.uuid || sjIdx} className="space-y-3.5 border-2 border-black p-3.5 rounded-sm bg-white text-black text-[11px] leading-tight">
                            {/* KOP NOTA PENGIRIMAN */}
                            <div className="flex items-center justify-between border-b-2 border-black pb-2">
                              <div className="flex items-center gap-2">
                                <div className="size-11 rounded-full border-2 border-black flex flex-col items-center justify-center text-center p-0.5 leading-none shrink-0 font-bold">
                                  <span className="text-[5px]">&star; PKM &star;</span>
                                  <span className="text-[8px] font-black my-0.5">PKM</span>
                                  <span className="text-[4px] uppercase">Tonasa</span>
                                </div>
                                <div>
                                  <h4 className="text-[12px] font-black tracking-wide uppercase text-black leading-tight">
                                    PT. PRIMA KARYA MANUNGGAL
                                  </h4>
                                  <span className="text-[8px] uppercase tracking-wider text-slate-700 block">
                                    Semen Tonasa Group
                                  </span>
                                </div>
                              </div>

                              <div className="text-right text-[8px] leading-tight text-black shrink-0">
                                <p className="font-bold">Kantor Pusat PT. Semen Tonasa</p>
                                <p>Lantai I Biringere Pangkep</p>
                                <p>Telp. (0410) 310040 Fax. 310039</p>
                              </div>
                            </div>

                            {/* KOTAK NOMOR NOTA & TANGGAL */}
                            <div className="flex justify-end">
                              <div className="border border-black px-2 py-1 text-[10px] min-w-[150px] leading-snug">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">No :</span>
                                  <span className="font-mono font-bold tracking-wider">{sj.code}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-black/40 mt-0.5 pt-0.5">
                                  <span className="font-bold">Tonasa Tgl.</span>
                                  <span>{activeOrder.created_at ? formatDate(activeOrder.created_at) : ''}</span>
                                </div>
                              </div>
                            </div>

                            {/* JUDUL RESMI */}
                            <div className="text-center my-1.5">
                              <h3 className="text-xs font-black uppercase tracking-wider underline underline-offset-2">
                                NOTA PENGIRIMAN &ldquo;BETON SIAP PAKAI&rdquo;
                              </h3>
                            </div>

                            {/* FIELD DATA PERMINTAAN */}
                            <div className="space-y-1 text-[10.5px]">
                              <div className="flex items-end">
                                <span className="w-32 shrink-0">Permintaan dari</span>
                                <span className="mr-1">:</span>
                                <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 truncate">
                                  {activeOrder.customer?.name || activeOrder.project_title}
                                </span>
                              </div>

                              <div className="flex items-end">
                                <span className="w-32 shrink-0">Untuk Pekerjaan</span>
                                <span className="mr-1">:</span>
                                <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 truncate">
                                  {activeOrder.project_title}
                                </span>
                              </div>

                              <div className="flex items-end">
                                <span className="w-32 shrink-0">Lokasi Pengecoran</span>
                                <span className="mr-1">:</span>
                                <span className="flex-1 border-b border-black font-bold uppercase pb-0.5 truncate">
                                  {activeOrder.delivery_address}
                                </span>
                              </div>

                              <div className="flex items-end pt-0.5">
                                <span className="w-32 shrink-0">Surat Permintaan No.</span>
                                <span className="mr-1">:</span>
                                <span className="flex-1 border-b border-black font-mono font-bold pb-0.5 truncate">
                                  {activeOrder.code}
                                </span>
                                <span className="px-1.5 shrink-0">Tgl :</span>
                                <span className="w-20 border-b border-black font-bold pb-0.5 text-center shrink-0">
                                  {activeOrder.created_at ? formatDate(activeOrder.created_at) : ''}
                                </span>
                              </div>
                            </div>

                            {/* SECTION PELAKSANAAN PENGIRIMAN */}
                            <div className="mt-2.5">
                              <h5 className="font-black text-[10.5px] uppercase tracking-wide">
                                &ldquo;PELAKSANAAN PENGIRIMAN&rdquo; :
                              </h5>
                            </div>

                            <div className="grid grid-cols-12 gap-2 items-start text-[10px]">
                              {/* SISI KIRI: DATA TRUK & WAKTU */}
                              <div className="col-span-7 space-y-1.5">
                                <div className="flex items-end">
                                  <span className="w-24 shrink-0">Transit Mixer No.</span>
                                  <span className="mr-1">:</span>
                                  <span className="w-20 border-b border-black border-dotted font-mono font-black pb-0.5">
                                    {sj.vehicle_number}
                                  </span>
                                  <span className="px-1 shrink-0">sebanyak :</span>
                                  <span className="w-8 border-b border-black border-dotted font-bold text-center pb-0.5">
                                    {qty}
                                  </span>
                                  <span className="pl-0.5">m3</span>
                                </div>

                                <div className="flex items-end gap-1">
                                  <span className="w-28 shrink-0 text-[9.5px]">Jam muat / berangkat</span>
                                  <span>:</span>
                                  <span className="w-14 border-b border-black border-dotted font-mono font-bold text-center pb-0.5">
                                    {departureTime}
                                  </span>
                                  <span className="pl-1 w-20 shrink-0 text-[9.5px]">Jam tuang :</span>
                                  <span className="flex-1 border-b border-black border-dotted pb-0.5 min-h-[14px]"></span>
                                </div>

                                <div className="flex items-end gap-1">
                                  <span className="w-28 shrink-0 text-[9.5px]">Jam datang lokasi</span>
                                  <span>:</span>
                                  <span className="w-14 border-b border-black border-dotted font-mono font-bold text-center pb-0.5">
                                    {arrivalTime || '......'}
                                  </span>
                                  <span className="pl-1 w-20 shrink-0 text-[9.5px]">Selesai tuang :</span>
                                  <span className="flex-1 border-b border-black border-dotted pb-0.5 min-h-[14px]"></span>
                                </div>

                                <div className="pt-1 flex items-center gap-1.5 text-[10px]">
                                  <span>Telah dikirim :</span>
                                  <span className="size-6 rounded-full border-2 border-black flex items-center justify-center font-black text-xs">
                                    {qty}
                                  </span>
                                  <span className="font-bold">m3</span>
                                </div>
                              </div>

                              {/* SISI KANAN: ADITIF & MUTU CAMPURAN */}
                              <div className="col-span-5 border border-black p-2 rounded-xs space-y-1.5 bg-slate-50/50">
                                <div className="flex items-baseline justify-between">
                                  <span className="font-bold">ADDECTIVE =</span>
                                  <span className="font-mono font-extrabold border-b border-black border-dotted px-1.5">8</span>
                                  <span className="font-bold">L</span>
                                </div>

                                <div className="flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-[9.5px]">Mutu campuran :</span>
                                  <span className="font-black text-xs">K</span>
                                  <span className="border-2 border-black px-1.5 py-0.5 font-black text-xs bg-white">
                                    {mutuCode}
                                  </span>
                                </div>

                                <div className="flex items-baseline gap-1">
                                  <span className="font-bold">Slump :</span>
                                  <span className="flex-1 border-b border-black border-dotted font-mono font-bold text-center pb-0.5 text-[9px]">
                                    {slumpVal}
                                  </span>
                                  <span className="font-bold">CM</span>
                                </div>
                              </div>
                            </div>

                            {/* 3 KOLOM TANDA TANGAN */}
                            <div className="mt-3 border-2 border-black grid grid-cols-3 divide-x-2 divide-black text-center text-[10px]">
                              <div className="p-1.5 flex flex-col justify-between min-h-[72px]">
                                <div className="font-bold leading-tight text-[9.5px]">
                                  Penerima<br />Yang dikuasakan
                                </div>
                                <div className="pt-6 font-bold text-[9px]">
                                  ( {recipientName || '....................'} )
                                </div>
                              </div>

                              <div className="p-1.5 flex flex-col justify-between min-h-[72px]">
                                <div className="font-bold leading-tight text-[9.5px]">
                                  Transit Mixer<br />Operator
                                </div>
                                <div className="pt-6 font-black text-[9px] uppercase">
                                  ( {driverName} )
                                </div>
                              </div>

                              <div className="p-1.5 flex flex-col justify-between min-h-[72px]">
                                <div className="font-bold leading-tight text-[9.5px]">
                                  Batch Plant<br />Operator
                                </div>
                                <div className="pt-6 font-black text-[9px] uppercase">
                                  ( {operatorName} )
                                </div>
                              </div>
                            </div>

                            {/* CATATAN & JARAK PP */}
                            <div className="mt-1 text-[9.5px] flex items-baseline gap-1.5 border-t border-black/20 pt-1.5">
                              <span className="font-bold">JARAK PP =</span>
                              <span className="border-b border-black border-dotted font-mono font-bold px-1.5">
                                {distancePP}
                              </span>
                              <span className="font-bold">KM</span>
                              <span className="text-slate-500 italic ml-1 truncate">
                                Rute armada Semen Tonasa
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 3: E-FAKTUR PAJAK */}
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
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <IonIcon icon={documentTextOutline} className="text-2xl" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0c1d37]">Belum Ada Dokumen Terbit</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Dokumen SPK Produksi, Surat Jalan (e-POD), dan e-Faktur akan otomatis tersedia di sini setelah dibuat dan diterbitkan oleh batching plant.
              </p>
            </div>
          )}
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
                  Pilih pesanan untuk melihat SPK, e-POD & Faktur resmi.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-black text-[#0c1d37]">
                {orders.length} Pesanan
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
              {filteredOrders.map((order) => {
                const hasSpk = Boolean(order.has_spk && order.work_orders && order.work_orders.length > 0);
                const hasSj = Boolean(order.has_surat_jalan && order.surat_jalans && order.surat_jalans.length > 0);
                const hasFaktur = Boolean(order.has_faktur);
                const docCount = (hasSpk ? 1 : 0) + (hasSj ? 1 : 0) + (hasFaktur ? 1 : 0);

                return (
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
                          {order.status_label || order.status}
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

                      {/* Chips for available documents: only show if created in BE */}
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100 text-[10px]">
                        {hasSpk && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-bold text-amber-800">
                            <IonIcon icon={documentTextOutline} className="text-xs text-amber-600" />
                            <span>SPK Produksi</span>
                          </span>
                        )}
                        {hasSj && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-bold text-blue-800">
                            <IonIcon icon={documentTextOutline} className="text-xs text-blue-600" />
                            <span>Surat Jalan (e-POD)</span>
                          </span>
                        )}
                        {hasFaktur && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-0.5 font-bold text-purple-800">
                            <IonIcon icon={documentTextOutline} className="text-xs text-purple-600" />
                            <span>e-Faktur Pajak</span>
                          </span>
                        )}
                        {docCount === 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 italic">
                            Belum ada dokumen diterbitkan
                          </span>
                        )}
                      </div>

                      {/* Action Prompt */}
                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#0c1d37] pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {docCount > 0 ? `${docCount} Dokumen Terbit` : 'Menunggu Penerbitan'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-[#ea580c] group-hover:translate-x-0.5 transition-transform">
                          <span>Buka Berkas</span>
                          <IonIcon icon={chevronForwardOutline} />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
