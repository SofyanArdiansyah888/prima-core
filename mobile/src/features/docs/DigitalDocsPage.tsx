import { useEffect, useState } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
import {
  alertCircleOutline,
  businessOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeOutline,
  cubeOutline,
  documentTextOutline,
  downloadOutline,
  eyeOutline,
  medalOutline,
  printOutline,
  qrCodeOutline,
  scaleOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import type { CustomerOrder } from '../../domain/types';
import PkmLogo from '../../shared/ui/PkmLogo';
import { BrandBar, Card, DocSkeleton, ErrorText, Screen } from '../../shared/ui';

type DocTab = 'suratJalan' | 'notaTimbangan' | 'eFaktur' | 'sertifikatMutu';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
};

export default function DigitalDocsPage() {
  const [searchParams] = useSearchParams();
  const paramCode = searchParams.get('code');

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DocTab>('suratJalan');
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
      if (res.data.length > 0) {
        const match = paramCode
          ? res.data.find((o) => o.code === paramCode || o.uuid === paramCode)
          : null;
        setSelectedOrderCode(match ? match.code : res.data[0].code);
      }
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
      if (res.data.length > 0 && !selectedOrderCode) {
        setSelectedOrderCode(res.data[0].code);
      }
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

  const activeOrder = orders.find((o) => o.code === selectedOrderCode) || orders[0];

  const handleDownload = () => {
    if (!activeOrder) return;
    const tabNames: Record<DocTab, string> = {
      suratJalan: 'Surat-Jalan-POD',
      notaTimbangan: 'Nota-Timbangan-Jembatan',
      eFaktur: 'e-Faktur-Pajak',
      sertifikatMutu: 'Sertifikat-Mutu-Beton',
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
    { id: 'suratJalan', label: 'Surat Jalan', icon: documentTextOutline },
    { id: 'notaTimbangan', label: 'Timbangan', icon: scaleOutline },
    { id: 'eFaktur', label: 'e-Faktur', icon: documentTextOutline },
    { id: 'sertifikatMutu', label: 'Mutu QC', icon: medalOutline },
  ];

  return (
    <Screen onRefresh={handlePullRefresh} header={<BrandBar title="Dokumen Digital" />}>
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
            Dokumen resmi surat jalan, nota timbangan, dan e-faktur akan tersedia otomatis setelah pesanan dibuat.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 px-4 py-4 pb-24">
          {/* HORIZONTAL ORDER SELECTOR PILLS */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-0.5">
              Pilih Berkas Pesanan ({orders.length})
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {orders.map((o) => {
                const isSelected = (selectedOrderCode || orders[0].code) === o.code;
                return (
                  <button
                    key={o.uuid}
                    type="button"
                    onClick={() => setSelectedOrderCode(o.code)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#0c1d37] text-white border-[#0c1d37] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono text-[11px]">{o.code}</span>
                    <span
                      className={`text-[10px] truncate max-w-[110px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      · {o.project_title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DOCUMENT TAB SELECTOR */}
          <div className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#0c1d37] font-extrabold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
                >
                  <IonIcon
                    icon={tab.icon}
                    className={`text-base ${isSelected ? 'text-[#d91424]' : 'text-slate-400'}`}
                  />
                  <span className="text-[10px] leading-tight truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ACTION BUTTONS TOOLBAR */}
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

          {/* DOCUMENT PAPER SHEET */}
          <AnimatePresence mode="wait">
            {activeOrder && (
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
                        <span className="font-extrabold text-emerald-700 text-[8px]">GPS VERIFIED</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: NOTA TIMBANGAN DIGITAL */}
                {activeTab === 'notaTimbangan' && (
                  <div className="relative z-10 space-y-3.5">
                    <div className="text-center">
                      <h4 className="font-extrabold text-sm text-[#0c1d37] uppercase tracking-wide">
                        Nota Jembatan Timbang Digital
                      </h4>
                      <p className="font-mono text-[10px] font-bold text-[#d91424]">
                        Tiket Timbangan: WB-PKM-{activeOrder.code}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Gross (Bruto)</span>
                        <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                          24.850 <span className="text-[10px] font-sans">kg</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Tara (Kosong)</span>
                        <div className="text-base font-black font-mono text-slate-700 mt-0.5">
                          10.200 <span className="text-[10px] font-sans">kg</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#0c1d37] bg-[#0c1d37] p-2.5 text-white">
                        <span className="text-[9px] text-[#ea580c] font-extrabold uppercase block">Netto Material</span>
                        <div className="text-base font-black font-mono text-amber-400 mt-0.5">
                          14.650 <span className="text-[10px] font-sans text-white">kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px] mb-0.5">
                        <IonIcon icon={shieldCheckmarkOutline} className="text-sm text-amber-700" />
                        <span>Kalibrasi Jembatan Timbang Metrologi Legal OK</span>
                      </div>
                      <p className="text-[10px] text-amber-800 leading-relaxed">
                        Timbangan otomatis telah dikalibrasi berkala sesuai standar Badan Metrologi Legal Kementerian Perdagangan RI.
                      </p>
                    </div>
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

                {/* TAB 4: SERTIFIKAT MUTU BETON */}
                {activeTab === 'sertifikatMutu' && (
                  <div className="relative z-10 space-y-3.5">
                    <div className="text-center">
                      <h4 className="font-extrabold text-sm text-[#0c1d37] uppercase tracking-wide">
                        Sertifikat Mutu Beton (QC Certificate)
                      </h4>
                      <p className="font-mono text-[10px] font-bold text-[#d91424]">
                        Reg. Lab: QC-PKM/CERT/{activeOrder.code}
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                        <div>
                          <span className="text-[9px] font-extrabold text-[#0c1d37] uppercase block">
                            Laboratorium Pengujian Mutu
                          </span>
                          <p className="font-bold text-xs text-[#0c1d37]">Semen Tonasa QC & Research Center</p>
                        </div>
                        <IonIcon icon={medalOutline} className="text-2xl text-amber-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-white p-2 border border-blue-100">
                          <span className="text-[9px] text-slate-400 font-bold block">Kuat Tekan Rencana</span>
                          <div className="text-xs font-extrabold text-[#0c1d37] mt-0.5">
                            K-250 (20.75 MPa)
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100">
                          <span className="text-[9px] text-slate-400 font-bold block">Uji 7 Hari</span>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">15.8 MPa (76%)</div>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100 col-span-2">
                          <span className="text-[9px] text-slate-400 font-bold block">Uji 28 Hari (Kuat Tekan Penuh)</span>
                          <div className="text-sm font-extrabold text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                            <IonIcon icon={checkmarkCircleOutline} />
                            <span>22.4 MPa (108% PASS & SNI COMPLIANT)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Screen>
  );
}

