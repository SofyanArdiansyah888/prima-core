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
import { Card, ErrorText, Eyebrow, NavBar, OrderDetailSkeleton, Screen, StatusBadge, StickyBar, SyncIcon } from '../../shared/ui';
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
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);

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

  const handleManualRefresh = async () => {
    if (!uuid) return;
    setRefreshing(true);
    try {
      if (order?.uuid && order.payment_method === 'MIDTRANS') {
        try {
          await api.syncPayment(order.uuid);
        } catch {
          // ignore background sync error
        }
      }
      const response = await api.order(uuid);
      setOrder(response.data);
      triggerToast('Status pesanan berhasil disinkronkan!', 'success');
    } catch (reason) {
      triggerToast(reason instanceof Error ? reason.message : 'Gagal memperbarui status.', 'error');
    } finally {
      setRefreshing(false);
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
      if (order?.uuid && order.payment_method === 'MIDTRANS') {
        try {
          await api.syncPayment(order.uuid);
        } catch {}
      }
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
            onSuccess: async () => {
              if (updatedOrder.uuid) {
                try {
                  await api.syncPayment(updatedOrder.uuid);
                } catch {}
              }
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

  const handleConfirmComplete = async () => {
    if (!uuid) return;
    setCompleting(true);
    try {
      const res = await api.confirmComplete(uuid);
      setOrder(res.data);
      triggerToast(res.message || 'Pesanan berhasil dikonfirmasi selesai!', 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Gagal mengonfirmasi penyelesaian pesanan.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const normalizeStatus = (status?: string): (typeof STATUS_STEPS)[number] | 'CANCELLED' | 'UNKNOWN' => {
    if (!status) return 'UNKNOWN';
    if (status === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
    if (status === 'DRAFT' || status === 'CONFIRMED') return 'CONFIRMED';
    if (status === 'WORK_ORDER_CREATED' || status === 'IN_PRODUCTION' || status === 'PROCESSING') return 'PROCESSING';
    if (status === 'PARTIAL_DELIVERY' || status === 'ON_DELIVERY') return 'ON_DELIVERY';
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'CANCELLED') return 'CANCELLED';
    return 'UNKNOWN';
  };
  const normalizedStatus = normalizeStatus(order?.status);
  const currentIndex = normalizedStatus !== 'UNKNOWN' && normalizedStatus !== 'CANCELLED'
    ? STATUS_STEPS.indexOf(normalizedStatus)
    : -1;
  const isCompleted = order?.status === 'COMPLETED';
  const isCancelled = order?.status === 'CANCELLED';
  const isPendingApproval = order?.status === 'PENDING_APPROVAL';
  const isActive = order && !isCompleted && !isCancelled;
  const isPendingPayment = order?.payment_status === 'PENDING' && !isCancelled;
  const canPay = Boolean(order?.can_pay ?? (isPendingPayment && !isPendingApproval));

  return (
    <Screen
      onRefresh={handlePullRefresh}
      header={(
        <NavBar
          title="Detail Pesanan"
          backHref="/tabs/orders"
          end={
            order ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleManualRefresh()}
                  disabled={refreshing}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Sinkronkan Status"
                >
                  <SyncIcon spinning={refreshing} className="size-3.5 text-slate-600" />
                  <span className="sr-only">Sync</span>
                </button>
                <button
                  type="button"
                  onClick={copyOrderCode}
                  className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 font-mono text-[11px] font-extrabold text-[#0c1d37] transition-colors cursor-pointer"
                  title="Salin Kode"
                >
                  <span>{order.code}</span>
                  <IonIcon icon={copiedCode ? checkmarkOutline : copyOutline} className={copiedCode ? 'text-emerald-600' : 'text-slate-500'} />
                </button>
              </div>
            ) : null
          }
        />
      )}
      footer={
        order?.can_confirm_complete ? (
          <StickyBar>
            <button
              type="button"
              disabled={completing}
              onClick={() => void handleConfirmComplete()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3 text-xs font-black text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <IonIcon icon={shieldCheckmarkOutline} className="text-base" />
              <span>{completing ? 'Menyimpan Konfirmasi…' : 'Konfirmasi Pesanan Diterima & Selesai'}</span>
            </button>
          </StickyBar>
        ) : order && (canPay || (isPendingApproval && isPendingPayment)) ? (
          <StickyBar>
            {isPendingApproval ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
                <IonIcon icon={alertCircleOutline} className="text-base shrink-0 text-amber-600" />
                <span className="leading-tight font-medium">
                  Menunggu verifikasi tempat oleh sales batching plant. Tombol bayar akan aktif setelah lokasi di-ACC.
                </span>
              </div>
            ) : (
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
          </StickyBar>
        ) : null
      }
    >
      {/* Toast Notification */}
      <div
        className={`fixed top-24 left-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${
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
                  {order.approved_at && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                      <IonIcon icon={checkmarkCircleOutline} className="text-emerald-400 text-xs shrink-0" />
                      <span>Lokasi Terverifikasi & Disetujui ({formatDate(order.approved_at)})</span>
                    </p>
                  )}
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
                  <p className="font-bold text-white mt-0.5 flex items-start gap-1 leading-snug">
                    <IonIcon icon={businessOutline} className="text-slate-400 text-xs mt-0.5 shrink-0" />
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

              {isCancelled && (
                <div className="mt-3 rounded-xl border border-red-300/40 bg-red-500/15 p-2.5 text-xs text-red-50">
                  <div className="flex items-center gap-1.5 font-bold text-red-200 text-[11px]">
                    <IonIcon icon={alertCircleOutline} className="shrink-0" />
                    <span>Pesanan Dibatalkan</span>
                  </div>
                  {order.cancellation_reason && (
                    <p className="mt-1 text-[11px] leading-relaxed text-white">"{order.cancellation_reason}"</p>
                  )}
                  {order.refund_amount != null && (
                    <p className="mt-1.5 text-[11px] font-bold text-emerald-200">
                      Refund {formatRupiah(order.refund_amount)} telah diproses admin
                      {order.refunded_at ? ` (${formatDate(order.refunded_at)})` : ''}.
                    </p>
                  )}
                </div>
              )}

              {/* Survey notes callout if present */}
              {order.survey_notes && (
                <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                    <IonIcon icon={shieldCheckmarkOutline} className="text-amber-400 shrink-0" />
                    <span>Catatan Verifikasi Lokasi Sales:</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white leading-relaxed italic">
                    "{order.survey_notes}"
                  </p>
                </div>
              )}

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

            {/* DELIVERY COMPLETED BY DRIVER - AWAITING CUSTOMER CONFIRMATION BANNER */}
            {order.can_confirm_complete && (
              <Card className="p-4 border-2 border-emerald-400 bg-emerald-50/80 shadow-sm space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      Pengantaran Tiba • Konfirmasi Penerimaan
                    </h3>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      Seluruh pengiriman beton telah selesai diserahterimakan di lokasi proyek Anda. Mohon periksa volume dan konfirmasi penyelesaian.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/90 p-2.5 text-[11px] text-slate-600 border border-emerald-200/80 leading-relaxed">
                  ⏱ <strong>Tenggat Otomatis:</strong> Pesanan akan otomatis ditutup dalam waktu <strong>2x24 jam</strong> jika tidak dikonfirmasi manual.
                </div>

                <button
                  type="button"
                  disabled={completing}
                  onClick={() => void handleConfirmComplete()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3 text-xs font-black text-white shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  <IonIcon icon={shieldCheckmarkOutline} className="text-base" />
                  <span>{completing ? 'Menyimpan Konfirmasi…' : 'Konfirmasi Pesanan Diterima & Selesai'}</span>
                </button>
              </Card>
            )}

            {/* PENDING APPROVAL - FORMAL APPRECIATION & STATUS CALLOUT */}
            {order.status === 'PENDING_APPROVAL' && (
              <Card className="p-3.5 border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-xl bg-orange-50 border border-orange-200/80 text-[#ea580c] flex items-center justify-center shrink-0">
                    <IonIcon icon={shieldCheckmarkOutline} className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0c1d37]">
                      Terima Kasih atas Pesanan Anda
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      Terima kasih telah mempercayakan kebutuhan beton siap pakai Anda kepada <strong className="text-[#0c1d37]">PT Prima Karya Manunggal (Semen Tonasa Group)</strong>. Pesanan Anda telah resmi tercatat. Saat ini Tim Sales Lapangan kami sedang meninjau kelayakan akses jalan dan manuver armada truk mixer menuju lokasi proyek sebelum pembayaran dibuka.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* ORDER STATUS TIMELINE STEPPER */}
            <Card className="p-4 border border-slate-200/90 shadow-xs">
              <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37]">
                  Tahapan Pelaksanaan Pesanan
                </h2>
                <span className="text-[10px] font-bold text-slate-400">
                  {isCancelled
                    ? 'Dibatalkan'
                    : isCompleted
                    ? `Semua Tahap Selesai (${STATUS_STEPS.length}/${STATUS_STEPS.length})`
                    : `Langkah ${Math.max(1, currentIndex + 1)} dari ${STATUS_STEPS.length}`}
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
                    const isPassed = isCompleted ? true : currentIndex >= index;
                    const isCurrent = isCompleted ? false : currentIndex === index;

                    const stepSubtext: Record<(typeof STATUS_STEPS)[number], string> = {
                      PENDING_APPROVAL: 'Tim sales plant memverifikasi akses jalan proyek untuk armada mixer',
                      CONFIRMED: 'Order disetujui (ACC). Menunggu pembayaran atau antrean produksi',
                      PROCESSING: 'Batching plant memproses produksi beton sesuai formula & SPK',
                      ON_DELIVERY: 'Truk mixer dalam perjalanan mengantarkan beton ke proyek',
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
            <Card className="!p-3 border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0c1d37]">
                  <IonIcon icon={cubeOutline} className="text-sm text-slate-500" />
                  Item & Spesifikasi Produk
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {order.items?.length || 0} Produk
                </span>
              </div>

              <div className="space-y-1.5">
                {order.items?.map((item, idx) => (
                  <div
                    key={`${item.code}-${idx}`}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold leading-snug text-slate-900">{item.name || item.code}</p>
                      <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                        <span className="font-mono font-semibold text-[#0c1d37]">{formatQty(item.quantity)} {item.unit}</span>
                        <span className="mx-1">·</span>
                        <span className="font-mono">@ {formatRupiah(item.unit_price)}</span>
                      </p>
                      {item.notes ? (
                        <p className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] leading-tight text-amber-800">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-[9px] leading-none text-slate-400">Subtotal</span>
                      <span className="font-mono text-[11px] font-bold leading-tight text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* PAYMENT & PRICE BREAKDOWN */}
            <Card className="!p-3 border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0c1d37]">
                  <IonIcon icon={walletOutline} className="text-sm text-slate-500" />
                  Rincian Pembayaran
                </span>
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

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>Metode</span>
                  <span className="font-bold text-slate-900">{order.payment_method === 'MIDTRANS' ? 'Midtrans' : order.payment_method_label}</span>
                </div>
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-800">{formatRupiah(order.subtotal)}</span>
                </div>
                {Number(order.delivery_fee) > 0 && (
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Ongkir ({order.distance_km || 0} km)</span>
                    <span className="font-mono font-medium text-slate-800">{formatRupiah(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>PPN 11%</span>
                  <span className="font-mono font-medium text-slate-800">{formatRupiah(order.ppn)}</span>
                </div>
                {Number(order.admin_fee) > 0 && (
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Biaya layanan</span>
                    <span className="font-mono font-medium text-slate-800">{formatRupiah(order.admin_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-[12px] font-extrabold text-[#0c1d37]">
                  <span>Total</span>
                  <span className="font-mono">{formatRupiah(order.total_price)}</span>
                </div>
              </div>

              {isPendingApproval ? (
                <div className="pt-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <IonIcon icon={alertCircleOutline} className="text-base shrink-0 text-amber-600" />
                      <span>Menunggu Verifikasi Lokasi Sales</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      Petugas sales plant sedang memastikan akses jalan proyek Anda aman untuk dilalui armada truk besar. Pembayaran Midtrans dapat dilakukan setelah pesanan disetujui.
                    </p>
                  </div>
                </div>
              ) : canPay ? (
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={paying}
                    onClick={() => void handlePay()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-black text-white shadow-xs transition-all cursor-pointer"
                  >
                    <IonIcon icon={walletOutline} className="text-sm" />
                    <span>{paying ? 'Menghubungkan Midtrans…' : 'Bayar Sekarang via Midtrans'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={() => void handleManualRefresh()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-4 text-[11px] font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <SyncIcon spinning={refreshing} className="size-3.5" />
                    <span>{refreshing ? 'Memeriksa Midtrans…' : 'Sudah Bayar? Cek Status Pembayaran'}</span>
                  </button>
                </div>
              ) : null}
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
                Butuh koordinasi slump beton, penyesuaian armada mixer, atau kendala di lokasi proyek? Hubungi petugas dispatching {order.plant?.name ?? 'plant'}.
              </p>

              {order.plant?.phone || order.plant?.whatsapp ? (
                <div className={`grid gap-2 pt-1 ${order.plant?.phone && order.plant?.whatsapp ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {order.plant?.phone ? (
                    <a
                      href={`tel:${order.plant.phone.replace(/[^\d+]/g, '')}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 px-3 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <IonIcon icon={callOutline} className="text-sm text-slate-600" />
                      <span>Telepon Plant</span>
                    </a>
                  ) : null}
                  {order.plant?.whatsapp ? (
                    <a
                      href={`https://wa.me/${order.plant.whatsapp}?text=${encodeURIComponent(`Halo Dispatcher, saya ingin koordinasi pesanan ${order.code}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white shadow-2xs transition-colors"
                    >
                      <IonIcon icon={logoWhatsapp} className="text-sm" />
                      <span>WhatsApp Plant</span>
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-400">Nomor dispatcher plant belum diisi.</p>
              )}
            </Card>
          </motion.div>
        ) : null}
      </div>
    </Screen>
  );
}


