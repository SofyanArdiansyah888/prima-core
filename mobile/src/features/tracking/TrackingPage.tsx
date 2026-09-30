import { useEffect, useState } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
import {
  alertCircleOutline,
  businessOutline,
  callOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronForwardOutline,
  closeOutline,
  copyOutline,
  cubeOutline,
  documentTextOutline,
  flashOutline,
  locationOutline,
  logoWhatsapp,
  navigateOutline,
  radioOutline,
  reloadOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
  speedometerOutline,
  syncOutline,
  thermometerOutline,
  timeOutline,
  busOutline,
  personOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import type { CustomerOrder } from '../../domain/types';
import { BrandBar, Card, ErrorText, Screen, TrackingSkeleton } from '../../shared/ui';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
};

export default function TrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCode = searchParams.get('code');

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3200);
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
      setError(err instanceof Error ? err.message : 'Gagal memuat status armada.');
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
      triggerToast('Status armada diperbarui secara realtime.', 'info');
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

  const getTrackingStep = (status: string) => {
    switch (status) {
      case 'DRAFT':
      case 'CONFIRMED':
        return 1;
      case 'WORK_ORDER_CREATED':
        return 2;
      case 'IN_PRODUCTION':
        return 3;
      case 'PARTIAL_DELIVERY':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 3;
    }
  };

  const currentStep = activeOrder ? getTrackingStep(activeOrder.status) : 3;

  const handleShareTracking = () => {
    if (!activeOrder) return;
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    triggerToast(`Tautan pelacakan armada pesanan ${activeOrder.code} disalin!`, 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const trackingSteps = [
    {
      num: 1,
      title: 'Pesanan Dikonfirmasi & Verifikasi',
      desc: 'Pesanan telah diverifikasi oleh Sales & Tim Logistik Tonasa',
      time: activeOrder?.created_at ? formatDate(activeOrder.created_at) : '08:30 WITA',
    },
    {
      num: 2,
      title: 'Batching Plant & Pemuatan Material',
      desc: 'Penimbangan agregat, semen Tonasa & pengisian ke drum mixer',
      time: '09:15 WITA',
    },
    {
      num: 3,
      title: 'Armada Mixer Dalam Perjalanan (GPS Active)',
      desc: 'Truk mixer bergerak menuju lokasi proyek pengecoran',
      time: '10:00 WITA',
    },
    {
      num: 4,
      title: 'Tiba di Lokasi & Pengujian Slump Test',
      desc: 'Pengujian slump test mutu beton & persiapan tuang pipa pompa',
      time: currentStep === 5 ? '10:30 WITA' : 'Estimasi 10:35 WITA',
    },
    {
      num: 5,
      title: 'Pengecoran Selesai & Dokumen Terbit',
      desc: 'Penuangan selesai, surat jalan & bukti penerimaan digital terbit',
      time: currentStep === 5 ? '11:15 WITA' : 'Menunggu',
    },
  ];

  return (
    <Screen onRefresh={handlePullRefresh} header={<BrandBar title="Lacak Pengiriman" />}>
      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 pointer-events-none opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <IonIcon icon={checkmarkCircleOutline} className="text-lg text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <IonIcon icon={radioOutline} className="text-lg text-amber-400 shrink-0" />}
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
        <TrackingSkeleton />
      ) : error ? (
        <div className="p-4">
          <ErrorText>{error}</ErrorText>
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
        >
          <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 shadow-inner">
            <IonIcon icon={busOutline} className="text-4xl" />
          </div>
          <h2 className="text-base font-extrabold text-[#0c1d37]">Belum Ada Pengiriman Aktif</h2>
          <p className="mt-1.5 max-w-xs text-xs text-slate-500 leading-relaxed">
            Buat pesanan semen sak atau beton ready mix dari katalog untuk memantau proses armada pengiriman secara terpadu.
          </p>
          <button
            type="button"
            onClick={() => navigate('/tabs/home')}
            className="mt-6 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-5 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            Buka Katalog Produk
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5 px-4 py-4 pb-24"
        >
          {/* HORIZONTAL ORDER SELECTOR PILLS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Pilih Armada Pesanan ({orders.length})
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>GPS Telematics Live</span>
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {orders.map((o) => {
                const isSelected = (selectedOrderCode || orders[0].code) === o.code;
                const isDone = o.status === 'COMPLETED';
                return (
                  <button
                    key={o.uuid}
                    type="button"
                    onClick={() => setSelectedOrderCode(o.code)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-[#0c1d37] text-white border-[#0c1d37] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-[#ea580c] animate-pulse'}`} />
                    <span className="font-mono text-[11px]">{o.code}</span>
                    <span className={`text-[10px] truncate max-w-[100px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      · {o.project_title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeOrder && (
              <motion.div
                key={activeOrder.code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* INTERACTIVE RADAR / GPS MAP VISUALIZER */}
                <div className="relative overflow-hidden rounded-2xl bg-[#081324] border border-slate-800 text-white shadow-lg p-4">
                  {/* Subtle Grid Map Texture Background */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
                      backgroundSize: '16px 16px',
                    }}
                  />

                  {/* Top GPS Status bar */}
                  <div className="relative z-10 flex items-center justify-between border-b border-slate-800/90 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <IonIcon icon={radioOutline} className="text-sm animate-pulse" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                            {currentStep === 5 ? 'Pengiriman Tuntas' : 'Pelacakan GPS Aktif'}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-slate-300">
                            DD 8920 XT
                          </span>
                        </div>
                        <h2 className="text-xs font-bold text-white truncate max-w-[190px]">
                          {activeOrder.project_title}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleShareTracking}
                      className="flex items-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <IonIcon icon={copiedLink ? checkmarkOutline : shareSocialOutline} className={copiedLink ? 'text-emerald-400' : 'text-slate-300'} />
                      <span>{copiedLink ? 'Disalin' : 'Bagikan'}</span>
                    </button>
                  </div>

                  {/* GPS Route Vector Display */}
                  <div className="relative z-10 my-4 py-2">
                    <div className="flex items-center justify-between text-xs">
                      {/* Origin: Plant */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-amber-400 shadow-inner">
                          <IonIcon icon={businessOutline} className="text-base" />
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Asal Plant</span>
                          <span className="font-bold text-xs text-slate-100 truncate max-w-[100px] block">
                            {activeOrder.plant?.name || 'Plant Pangkep'}
                          </span>
                        </div>
                      </div>

                      {/* Route Progress line with Animated Truck */}
                      <div className="flex-1 mx-3 relative">
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-[#ea580c] transition-all duration-500"
                            style={{ width: currentStep === 5 ? '100%' : '65%' }}
                          />
                        </div>

                        {/* Animated Truck Icon on path */}
                        <div
                          className="absolute -top-3 -translate-x-1/2 flex flex-col items-center"
                          style={{ left: currentStep === 5 ? '92%' : '65%' }}
                        >
                          <div className="flex size-6 items-center justify-center rounded-full bg-amber-400 text-[#081324] shadow-md ring-2 ring-amber-400/40 animate-bounce">
                            <IonIcon icon={busOutline} className="text-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Destination: Project Site */}
                      <div className="flex items-center gap-2 text-right">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Tujuan Proyek</span>
                          <span className="font-bold text-xs text-slate-100 truncate max-w-[100px] block">
                            {activeOrder.project_title}
                          </span>
                        </div>
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner">
                          <IonIcon icon={locationOutline} className="text-base" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ETA & Distance Telemetry strip */}
                  <div className="relative z-10 grid grid-cols-3 gap-2 rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Estimasi Tiba</span>
                      <p className="font-mono font-black text-amber-400 mt-0.5 text-xs">
                        {currentStep === 5 ? 'Telah Tiba' : '10:35 WITA'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Jarak Tempuh</span>
                      <p className="font-mono font-black text-white mt-0.5 text-xs">
                        {activeOrder.distance_km || 14.5} km
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Kecepatan Armada</span>
                      <p className="font-mono font-black text-emerald-400 mt-0.5 text-xs">
                        {currentStep === 5 ? '0 km/h (Standby)' : '36 km/jam'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MIXER FLEET TELEMETRY & DRIVER CARD */}
                <Card className="p-4 space-y-3.5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37] flex items-center gap-1.5">
                      <IonIcon icon={flashOutline} className="text-[#ea580c]" />
                      <span>Armada Mixer & Telemetri Mutu</span>
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Standar SNI 2847
                    </span>
                  </div>

                  {/* Driver Profile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c1d37] to-[#162e55] text-white shadow-xs">
                        <IonIcon icon={personOutline} className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-[#0c1d37]">Muh. Yusuf S.</p>
                        <p className="text-[11px] font-semibold text-slate-500">Pengemudi Senior • Sertifikasi K3</p>
                        <p className="font-mono text-[10px] text-slate-400">Truk Mixer #04 · DD 8920 XT</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href="tel:081234567890"
                        className="flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Telepon Driver"
                      >
                        <IonIcon icon={callOutline} className="text-base" />
                      </a>
                      <a
                        href={`https://wa.me/6281234567890?text=Halo%20Pak%20Yusuf,%20saya%20ingin%20koordinasi%20truk%20mixer%20pesanan%20${activeOrder.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        <IonIcon icon={logoWhatsapp} className="text-sm" />
                        <span>Chat WA</span>
                      </a>
                    </div>
                  </div>

                  {/* Telematics Sensors */}
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                        <IonIcon icon={syncOutline} className="text-xs text-slate-500" />
                        <span>Drum Agitasi</span>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-900 mt-0.5 block">14 RPM</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                        <IonIcon icon={cubeOutline} className="text-xs text-slate-500" />
                        <span>Target Slump</span>
                      </div>
                      <span className="font-mono text-xs font-black text-[#0c1d37] mt-0.5 block">12 ± 2 cm</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                        <IonIcon icon={thermometerOutline} className="text-xs text-slate-500" />
                        <span>Suhu Campuran</span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-700 mt-0.5 block">29.4 °C</span>
                    </div>
                  </div>
                </Card>

                {/* TRACKING TIMELINE STEPS */}
                <Card className="p-4 border border-slate-200/90 shadow-xs">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37]">
                      Timeline Pengiriman Pabrik Tonasa
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      Step {currentStep} dari 5
                    </span>
                  </div>

                  <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200">
                    {trackingSteps.map((step) => {
                      const isPassed = currentStep >= step.num;
                      const isCurrent = currentStep === step.num;

                      return (
                        <div key={step.num} className="relative flex items-start gap-3.5 pl-0.5 text-xs">
                          {/* Step Marker */}
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold transition-all z-10 ${
                              isCurrent
                                ? 'bg-[#0c1d37] text-white ring-4 ring-[#0c1d37]/15 shadow-xs'
                                : isPassed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isPassed && !isCurrent ? (
                              <IonIcon icon={checkmarkCircle} className="text-xs" />
                            ) : (
                              step.num
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`font-bold text-xs ${isPassed ? 'text-[#0c1d37]' : 'text-slate-400'}`}>
                                {step.title}
                              </h4>
                              <span className={`text-[10px] font-mono shrink-0 ${isPassed ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>
                                {step.time}
                              </span>
                            </div>
                            <p className={`mt-0.5 text-[11px] leading-relaxed ${isPassed ? 'text-slate-500' : 'text-slate-400'}`}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* SHORTCUT TO DIGITAL DOCS */}
                <div
                  onClick={() => navigate(`/tabs/docs?code=${activeOrder.code}`)}
                  className="flex items-center justify-between rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-[#0c1d37]/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0c1d37]">
                      <IonIcon icon={documentTextOutline} className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0c1d37]">Lihat Dokumen Digital Pesanan Ini</h4>
                      <p className="text-[10px] text-slate-400">Surat Jalan, Nota Timbangan, & Sertifikat Mutu</p>
                    </div>
                  </div>
                  <IonIcon icon={chevronForwardOutline} className="text-slate-400 text-base" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </Screen>
  );
}

