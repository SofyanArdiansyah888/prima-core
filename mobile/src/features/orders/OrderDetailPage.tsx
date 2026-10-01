import { useEffect, useState } from 'react';
import { IonIcon, type RefresherEventDetail } from '@ionic/react';
import {
  alertCircleOutline,
  businessOutline,
  callOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  copyOutline,
  cubeOutline,
  documentTextOutline,
  locationOutline,
  logoWhatsapp,
  receiptOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import { orderStatusTone, paymentStatusLabel } from '../../domain/rules';
import { STATUS_LABELS, STATUS_STEPS, type CustomerOrder } from '../../domain/types';
import { Card, ConfirmModal, ErrorText, Eyebrow, NavBar, OrderDetailSkeleton, Screen, StatusBadge, StickyBar } from '../../shared/ui';
import { openSnapPayment } from '../../lib/midtrans';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
};

export default function OrderDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const loadOrder = async () => {
    if (!uuid) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.order(uuid);
      setOrder(response.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat detail pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [uuid]);

  const handlePullRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    if (!uuid) {
      event.detail.complete();
      return;
    }
    try {
      const response = await api.order(uuid);
      setOrder(response.data);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memperbarui data.');
    } finally {
      event.detail.complete();
    }
  };

  const copyOrderCode = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.code);
    setCopiedCode(true);
    triggerToast(`Kode pesanan ${order.code} disalin ke papan klip!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const cancel = async () => {
    if (!order) return;

    setCancelling(true);
    try {
      const response = await api.cancelOrder(order.uuid);
      setOrder(response.data);
      setShowCancelModal(false);
      triggerToast('Pesanan berhasil dibatalkan.', 'info');
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const res = await api.payOrder(order.uuid);
      const updatedOrder = res.data;
      setOrder(updatedOrder);
      if (updatedOrder.snap_token) {
        void openSnapPayment(
          updatedOrder.snap_token,
          {
            onSuccess: () => {
              void loadOrder();
              triggerToast('Pembayaran berhasil diverifikasi!', 'success');
            },
            onPending: () => {
              void loadOrder();
              triggerToast('Menunggu pembayaran diselesaikan.', 'info');
            },
            onError: () => {
              triggerToast('Pembayaran gagal atau dibatalkan.', 'error');
            },
            onClose: () => {
              void loadOrder();
            },
          },
          updatedOrder.midtrans_client_key || undefined
        );
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Gagal membuka pembayaran Midtrans.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const currentIndex = order ? STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]) : -1;
  const isCompleted = order?.status === 'COMPLETED';
  const isCancelled = order?.status === 'CANCELLED';
  const isActive = order && !isCompleted && !isCancelled;
  const isPendingPayment = order?.payment_status === 'PENDING' && !isCancelled;

  return (
    <Screen
      onRefresh={handlePullRefresh}
      header={(
        <NavBar
          title="Detail Pesanan"
          backHref="/tabs/orders"
          end={
            order ? (
              <button
                type="button"
                onClick={copyOrderCode}
                className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 font-mono text-[11px] font-extrabold text-[#0c1d37] transition-colors cursor-pointer"
                title="Salin Kode"
              >
                <span>{order.code}</span>
                <IonIcon icon={copiedCode ? checkmarkOutline : copyOutline} className={copiedCode ? 'text-emerald-600' : 'text-slate-500'} />
              </button>
            ) : null
          }
        />
      )}
      footer={order && (!isCancelled || order.can_cancel) ? (
        <StickyBar>
          <div className="space-y-2">
            {isPendingPayment && (
              <button
                type="button"
                disabled={paying}
                onClick={() => void handlePay()}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3 text-xs font-black text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <IonIcon icon={walletOutline} className="text-base" />
                <span>{paying ? 'Menghubungkan Midtrans…' : `Bayar Sekarang (${formatRupiah(order.total_price)})`}</span>
              </button>
            )}

            {order.can_cancel && (
              <button
                type="button"
                disabled={cancelling}
                className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 text-xs font-bold text-[#d91424] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                onClick={() => setShowCancelModal(true)}
              >
                <IonIcon icon={closeCircleOutline} className="text-base" />
                <span>{cancelling ? 'Membatalkan…' : 'Batalkan Pesanan Ini'}</span>
              </button>
            )}
          </div>
        </StickyBar>
      ) : null}
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
            {toast.type === 'info' && <IonIcon icon={receiptOutline} className="text-lg text-amber-400 shrink-0" />}
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

      <div className="space-y-4 px-4 py-4 pb-24">
        <ErrorText>{error}</ErrorText>

        {loading ? (
          <OrderDetailSkeleton />
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* HERO PROJECT & DISPATCH STATUS BANNER */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1d37] via-[#162e55] to-[#0c1d37] p-4.5 text-white shadow-md border border-slate-700/60">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                    Target Proyek Konstruksi
                  </span>
                  <h1 className="mt-1 text-base font-extrabold text-white leading-snug">{order.project_title}</h1>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
                    <IonIcon icon={locationOutline} className="text-amber-400 shrink-0 text-xs" />
                    <span>{order.delivery_address}</span>
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCancelled
                      ? 'bg-[#d91424] text-white'
                      : 'bg-[#ea580c] text-white'
                  }`}
                >
                  {isActive && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                  <span>{order.status_label}</span>
                </span>
              </div>

              {/* Plant info & Date */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/80 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-300 block">Plant Pengirim</span>
                  <p className="font-bold text-white mt-0.5 truncate flex items-center gap-1">
                    <IonIcon icon={businessOutline} className="text-slate-400 text-xs" />
                    <span>{order.plant?.name || 'Batching Plant Pangkep'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-300 block">Waktu Pemesanan</span>
                  <p className="font-mono font-bold text-slate-200 mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {/* Quick Action Button inside Hero */}
              <div className="mt-4 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(`/tabs/docs?code=${order.code}`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 py-2.5 px-4 text-xs font-bold text-white backdrop-blur-xs transition-all cursor-pointer border border-white/20 shadow-xs"
                >
                  <IonIcon icon={documentTextOutline} className="text-sm text-blue-300" />
                  <span>Lihat Dokumen Digital Pesanan</span>
                </button>
              </div>
            </div>

            {/* ORDER STATUS TIMELINE STEPPER */}
            <Card className="p-4 border border-slate-200/90 shadow-xs">
              <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37]">
                  Tahapan Pelaksanaan Pesanan
                </h2>
                <span className="text-[10px] font-bold text-slate-400">
                  {isCancelled ? 'Dibatalkan' : `Langkah ${Math.max(1, currentIndex + 1)} dari 5`}
                </span>
              </div>

              {isCancelled ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#d91424]">
                  <IonIcon icon={closeCircleOutline} className="text-xl shrink-0" />
                  <div>
                    <p className="font-bold">Pesanan ini telah dibatalkan</p>
                    <p className="text-[11px] text-red-600 mt-0.5">Seluruh proses dispatch dan penagihan telah dihentikan.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200">
                  {STATUS_STEPS.map((step, index) => {
                    const isPassed = currentIndex >= index;
                    const isCurrent = currentIndex === index;

                    const stepSubtext: Record<string, string> = {
                      CONFIRMED: 'Order diverifikasi & dialokasikan ke jadwal plant',
                      WORK_ORDER_CREATED: 'Surat Perintah Kerja (SPK) batching terbit resmi',
                      IN_PRODUCTION: 'Pemuatan semen / penimbangan agregat ready mix',
                      PARTIAL_DELIVERY: 'Armada bergerak menuju lokasi proyek pengecoran',
                      COMPLETED: 'Pengecoran selesai, e-POD & Surat Jalan tervalidasi',
                    };

                    return (
                      <div key={step} className="relative flex items-start gap-3 pl-0.5 text-xs">
                        {/* Step Icon / Dot */}
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
                            index + 1
                          )}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-xs ${isPassed ? 'text-[#0c1d37]' : 'text-slate-400'}`}>
                              {STATUS_LABELS[step]}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/20 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                                Berlangsung
                              </span>
                            )}
                            {isPassed && !isCurrent && (
                              <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold">
                                Selesai
                              </span>
                            )}
                          </div>
                          <p className={`mt-0.5 text-[11px] leading-tight ${isPassed ? 'text-slate-500' : 'text-slate-400'}`}>
                            {stepSubtext[step]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ORDER ITEMS & MATERIAL DETAIL */}
            <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37] flex items-center gap-1.5">
                  <IonIcon icon={cubeOutline} className="text-slate-500" />
                  <span>Item & Spesifikasi Produk</span>
                </h2>
                <span className="text-[10px] font-bold text-slate-400">
                  {order.items?.length || 0} Produk
                </span>
              </div>

              <div className="space-y-2.5">
                {order.items?.map((item, idx) => (
                  <div
                    key={`${item.code}-${idx}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="font-extrabold text-slate-900 leading-tight">{item.name || item.code}</h3>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-[#0c1d37]">{formatQty(item.quantity)} {item.unit}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">@ {formatRupiah(item.unit_price)}</span>
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 inline-block">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Subtotal</span>
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* PAYMENT & PRICE BREAKDOWN */}
            <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37] flex items-center gap-1.5">
                  <IonIcon icon={walletOutline} className="text-slate-500" />
                  <span>Rincian Pembayaran</span>
                </h2>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${
                  order.payment_status === 'PAID'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : order.payment_status === 'PENDING'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-[#d91424]'
                }`}>
                  {paymentStatusLabel(order.payment_status)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-slate-900">{order.payment_method_label}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Dasar (DPP)</span>
                  <span className="font-mono font-medium text-slate-800">{formatRupiah(order.subtotal)}</span>
                </div>
                {Number(order.delivery_fee) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pengantaran ({order.distance_km || 0} km)</span>
                    <span className="font-mono font-medium text-slate-800">{formatRupiah(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>PPN Resmi (11%)</span>
                  <span className="font-mono font-medium text-slate-800">{formatRupiah(order.ppn)}</span>
                </div>
                {Number(order.admin_fee) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Biaya Layanan & Pembayaran</span>
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600 font-medium">Midtrans</span>
                    </span>
                    <span className="font-mono font-medium text-slate-800">{formatRupiah(order.admin_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-extrabold text-[#0c1d37]">
                  <span>Total Tagihan Akhir</span>
                  <span className="font-mono text-base font-black text-[#0c1d37]">{formatRupiah(order.total_price)}</span>
                </div>
              </div>

              {isPendingPayment && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={paying}
                    onClick={() => void handlePay()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-black text-white shadow-xs transition-all cursor-pointer"
                  >
                    <IonIcon icon={walletOutline} className="text-sm" />
                    <span>{paying ? 'Menghubungkan Midtrans…' : 'Bayar Sekarang via Midtrans'}</span>
                  </button>
                </div>
              )}
            </Card>

            {/* LOGISTICS & DISPATCH CONTACT CARD */}
            <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37]">
                  Bantuan & Dispatcher Plant
                </h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Siaga 24 Jam
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Butuh koordinasi slump beton, penyesuaian armada mixer, atau kendala di lokasi proyek? Hubungi petugas dispatching plant.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:041021012"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 px-3 text-xs font-bold text-slate-700 transition-colors"
                >
                  <IonIcon icon={callOutline} className="text-sm text-slate-600" />
                  <span>Telepon Plant</span>
                </a>
                <a
                  href={`https://wa.me/628114400234?text=Halo%20Dispatcher%20PKM,%20saya%20ingin%20koordinasi%20pesanan%20${order.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white shadow-2xs transition-colors"
                >
                  <IonIcon icon={logoWhatsapp} className="text-sm" />
                  <span>WhatsApp CS</span>
                </a>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </div>

      {/* Confirmation Modal for Order Cancellation */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Batalkan Pesanan Ini?"
        description={`Apakah Anda yakin ingin membatalkan pesanan "${order?.code}"? Pesanan yang telah dibatalkan tidak dapat diproses kembali oleh sistem batching plant.`}
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Kembali"
        tone="danger"
        iconType="alert"
        onConfirm={() => void cancel()}
        onClose={() => setShowCancelModal(false)}
      />
    </Screen>
  );
}


