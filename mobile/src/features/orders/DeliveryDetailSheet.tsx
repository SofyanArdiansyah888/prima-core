import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { busOutline, callOutline, closeOutline, personOutline, timeOutline } from 'ionicons/icons';
import { formatQty } from '../../domain/format';
import type { OrderSuratJalan } from '../../domain/types';
import { SitePhotoCapture } from '../../shared/ui';

type Props = {
  isOpen: boolean;
  suratJalans: OrderSuratJalan[];
  onClose: () => void;
};

const SJ_STATUS: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700' },
  RETURNED: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700' },
};

function formatTime(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Detail pengiriman per surat jalan: sopir, kendaraan, penerima, dan foto tiba dari sopir. */
export function DeliveryDetailSheet({ isOpen, suratJalans, onClose }: Props) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Detail pengiriman"
            className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#0c1d37]">Detail Pengiriman</h2>
                <p className="text-[11px] text-slate-500">{suratJalans.length} surat jalan untuk pesanan ini</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                aria-label="Tutup"
              >
                <IonIcon icon={closeOutline} className="text-xl" />
              </button>
            </div>

            {suratJalans.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                Belum ada surat jalan untuk pesanan ini.
              </p>
            ) : (
              <div className="space-y-3">
                {suratJalans.map((sj) => {
                  const status = SJ_STATUS[sj.status] ?? { label: 'Dalam Perjalanan', className: 'bg-amber-100 text-amber-800' };
                  const received = sj.items.find((i) => i.received_at || i.recipient_name);

                  return (
                    <div key={sj.uuid} className="space-y-3 rounded-2xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-mono text-xs font-black text-[#0c1d37]">{sj.code}</span>
                          <p className="text-[11px] text-slate-500">
                            {sj.items.map((i) => `${i.product_name ?? 'Material'} · ${formatQty(i.quantity)} ${i.unit}`).join(', ')}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                        <div>
                          <dt className="flex items-center gap-1 text-slate-400"><IonIcon icon={personOutline} /> Sopir</dt>
                          <dd className="font-bold text-slate-800">{sj.driver_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-slate-400"><IonIcon icon={busOutline} /> Kendaraan</dt>
                          <dd className="font-bold text-slate-800">{sj.vehicle_number || '-'}</dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-slate-400"><IonIcon icon={timeOutline} /> Berangkat</dt>
                          <dd className="font-medium text-slate-700">{formatTime(sj.departure_time ?? sj.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-slate-400"><IonIcon icon={timeOutline} /> Tiba</dt>
                          <dd className="font-medium text-slate-700">{formatTime(sj.arrival_time)}</dd>
                        </div>
                        {received ? (
                          <div className="col-span-2">
                            <dt className="text-slate-400">Diterima oleh</dt>
                            <dd className="font-bold text-slate-800">
                              {received.recipient_name || '-'}
                              {received.received_at ? (
                                <span className="font-normal text-slate-500"> · {formatTime(received.received_at)}</span>
                              ) : null}
                            </dd>
                          </div>
                        ) : null}
                      </dl>

                      {sj.driver_phone ? (
                        <a
                          href={`tel:${sj.driver_phone.replace(/[^\d+]/g, '')}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <IonIcon icon={callOutline} className="text-sm" />
                          <span>Telepon Sopir</span>
                        </a>
                      ) : null}

                      <SitePhotoCapture
                        title="Foto dari Sopir"
                        stampLabel="SOPIR"
                        reference={sj.code}
                        photos={sj.site_photos ?? []}
                        readOnly
                        upload={() => Promise.reject(new Error('Tidak tersedia'))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
