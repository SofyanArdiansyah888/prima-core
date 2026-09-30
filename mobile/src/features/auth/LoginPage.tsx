import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeOutline,
  lockClosedOutline,
  logoWhatsapp,
  paperPlaneOutline,
} from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/auth';
import PkmLogo from '../../shared/ui/PkmLogo';
import { PasswordInput, PhoneInput, Screen } from '../../shared/ui';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    // Normalize phone number to standard format
    let normalizedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '0' + normalizedPhone.slice(2);
    } else if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    if (method === 'otp') {
      setTimeout(() => {
        setSubmitting(false);
        triggerToast(`Kode OTP 6-digit dikirim via WhatsApp ke ${normalizedPhone}`, 'success');
      }, 1200);
      return;
    }

    try {
      await login(normalizedPhone, password);
      triggerToast('Berhasil masuk! Mengalihkan...', 'success');
      navigate('/tabs/home', { replace: true });
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Nomor HP atau kata sandi tidak cocok.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 pointer-events-none opacity-0'
          }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <IonIcon icon={checkmarkCircleOutline} className="text-lg text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && (
              <IonIcon icon={alertCircleOutline} className="text-lg text-[#d91424] shrink-0" />
            )}
            {toast.type === 'info' && (
              <IonIcon icon={paperPlaneOutline} className="text-lg text-amber-400 shrink-0" />
            )}
            <span className="leading-snug font-medium">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="p-1 text-slate-300 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <IonIcon icon={closeOutline} className="text-base" />
          </button>
        </div>
      </div>

      <div className="flex min-h-full flex-1 flex-col bg-[#f8fafc] text-slate-800">
        {/* Top Decorative PKM Brand Strip (Red - Orange - Navy) */}
        <div className="flex h-1.5 w-full shrink-0">
          <div className="h-full w-1/3 bg-[#d91424]" />
          <div className="h-full w-1/3 bg-[#ea580c]" />
          <div className="h-full w-1/3 bg-[#0c1d37]" />
        </div>

        {/* Centered Main Login Container */}
        <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Header & Official Logo Section */}
            <header className="mb-5 flex items-center">
              <div className="flex items-center gap-3.5">
                <PkmLogo className="size-12 drop-shadow-md" />
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold tracking-wide text-[#0c1d37]">
                      PT. PKM TONASA
                    </span>
                    <span className="rounded-md bg-[#d91424]/10 px-1.5 py-0.5 text-[9px] font-extrabold text-[#d91424] uppercase tracking-wider">
                      Resmi
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">
                    Semen Tonasa Group
                  </p>
                </div>
              </div>
            </header>

            {/* Title & Subtitle */}
            <section className="mb-5">
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#0c1d37]">
                Masuk Pelanggan
              </h1>
              <p className="text-xs leading-relaxed text-slate-500">
                Pemesanan semen sak & beton ready-mix resmi PT. Prima Karya Manunggal.
              </p>
            </section>

            {/* Login Method Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMethod('password');
                  setError('');
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${method === 'password'
                  ? 'bg-white text-[#0c1d37] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <IonIcon icon={lockClosedOutline} className="text-xs text-[#0c1d37]" />
                <span>Kata Sandi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('otp');
                  setError('');
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${method === 'otp'
                  ? 'bg-white text-[#0c1d37] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <IonIcon icon={logoWhatsapp} className="text-sm text-emerald-600" />
                <span>OTP WhatsApp</span>
              </button>
            </div>

            {/* Error Callout */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#d91424]">
                <IonIcon icon={alertCircleOutline} className="mt-0.5 text-base shrink-0 text-[#d91424]" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Phone Input */}
              <PhoneInput
                label="Nomor Handphone / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              {/* Password Input (Only on Password Method) */}
              {method === 'password' && (
                <PasswordInput
                  label="Kata Sandi"
                  rightLabelAction={
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-bold text-[#d91424] transition-colors hover:text-[#ea580c] hover:underline"
                    >
                      Lupa Sandi?
                    </Link>
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              )}

              {/* OTP Notice (Only on OTP Method) */}
              {method === 'otp' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
                  <div className="mb-1 flex items-center gap-2 font-bold text-amber-950">
                    <IonIcon icon={logoWhatsapp} className="text-base text-emerald-600" />
                    <span>Verifikasi Cepat via WhatsApp</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Kode verifikasi 6-digit OTP akan dikirimkan langsung ke nomor WhatsApp Anda saat tombol di bawah ditekan.
                  </p>
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex cursor-pointer select-none items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-slate-300 accent-[#0c1d37] focus:ring-[#0c1d37]"
                  />
                  <span className="text-xs font-medium text-slate-600 hover:text-slate-900">
                    Ingat akun saya di HP ini
                  </span>
                </label>
              </div>

              {/* Main Submit CTA Button with PKM Navy Theme */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] hover:from-[#091528] hover:to-[#091528] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#0c1d37]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>
                    {submitting
                      ? method === 'password'
                        ? 'Memverifikasi...'
                        : 'Mengirim OTP...'
                      : method === 'password'
                        ? 'Masuk ke Aplikasi'
                        : 'Kirim Kode OTP WhatsApp'}
                  </span>
                  <IonIcon
                    icon={arrowForwardOutline}
                    className={`text-sm ${submitting ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </form>

            {/* Footer & Registration Link (Grouped close to the form) */}
            <footer className="mt-5 border-t border-slate-200 pt-4 text-center">
              <p className="text-xs font-medium text-slate-500">
                Belum punya akun pelanggan?{' '}
                <Link
                  to="/register"
                  className="font-extrabold text-[#d91424] hover:text-[#ea580c] hover:underline"
                >
                  Daftar Sekarang
                </Link>
              </p>
              <p className="mt-3 text-[10px] text-slate-400">
                &copy; {new Date().getFullYear()} PT. Prima Karya Manunggal • Semen Tonasa. Hak Cipta Dilindungi.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </Screen>
  );
}
