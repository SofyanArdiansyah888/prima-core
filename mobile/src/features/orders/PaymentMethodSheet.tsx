import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { cardOutline, checkmarkCircle, closeOutline, qrCodeOutline, walletOutline } from 'ionicons/icons';
import { formatRupiah } from '../../domain/format';
import type { PaymentOption } from '../../domain/types';

type Props = {
  isOpen: boolean;
  loading: boolean;
  options: PaymentOption[];
  selected: string | null;
  submitting: boolean;
  error?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

function groupIcon(group: string) {
  if (group.toLowerCase().includes('kartu')) return cardOutline;
  if (group.toLowerCase().includes('qris')) return qrCodeOutline;
  return walletOutline;
}

/**
 * Pilih metode pembayaran Midtrans. Setiap opsi menampilkan total final yang dibayar
 * (sudah termasuk biaya layanan sesuai metode), tanpa merinci biaya.
 */
export function PaymentMethodSheet({ isOpen, loading, options, selected, submitting, error, onSelect, onClose }: Props) {
  if (typeof document === 'undefined') return null;

  const groups = options.reduce<Record<string, PaymentOption[]>>((acc, option) => {
    (acc[option.group] ??= []).push(option);
    return acc;
  }, {});

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={submitting ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Pilih metode pembayaran"
            className="relative w-full max-w-md rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#0c1d37]">Pilih Metode Pembayaran</h2>
                <p className="text-[11px] text-slate-500">Total sudah termasuk pajak, ongkos kirim, dan biaya layanan metode.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                aria-label="Tutup"
              >
                <IonIcon icon={closeOutline} className="text-xl" />
              </button>
            </div>

            {error ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#d91424]">{error}</p>
            ) : null}

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <IonIcon icon={groupIcon(group)} className="text-xs" />
                      {group}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          disabled={submitting}
                          onClick={() => onSelect(option.code)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition cursor-pointer disabled:opacity-60 ${
                            selected === option.code
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2 text-xs font-bold text-[#0c1d37]">
                            {selected === option.code ? <IonIcon icon={checkmarkCircle} className="text-base text-emerald-600" /> : null}
                            {option.label}
                          </span>
                          <span className="font-mono text-xs font-extrabold text-[#0c1d37]">{formatRupiah(option.total)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {submitting ? (
              <p className="mt-4 text-center text-xs font-semibold text-slate-500">Menyiapkan pembayaran…</p>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
