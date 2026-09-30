import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, trashOutline, logOutOutline } from 'ionicons/icons';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
  iconType?: 'trash' | 'alert' | 'logout';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  tone = 'danger',
  iconType = 'alert',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (typeof document === 'undefined') return null;

  const getIcon = () => {
    if (iconType === 'trash') return trashOutline;
    if (iconType === 'logout') return logOutOutline;
    return alertCircleOutline;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0c1d37]/60 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.25 }}
            className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl border border-slate-100 z-10"
          >
            {/* Icon Header */}
            <div className={`mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl ${
              tone === 'danger' ? 'bg-red-50 text-[#d91424]' : 'bg-slate-100 text-[#0c1d37]'
            }`}>
              <IonIcon icon={getIcon()} className="text-2xl" />
            </div>

            <h3 className="text-sm font-extrabold text-[#0c1d37] leading-snug">
              {title}
            </h3>
            
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer ${
                  tone === 'danger' 
                    ? 'bg-[#d91424] hover:bg-red-700 shadow-red-500/20' 
                    : 'bg-[#0c1d37] hover:bg-[#162e55] shadow-[#0c1d37]/20'
                }`}
              >
                {confirmText}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
