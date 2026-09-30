import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeOutline,
  keyOutline,
  lockClosedOutline,
  logoWhatsapp,
  paperPlaneOutline,
} from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import PkmLogo from '../../shared/ui/PkmLogo';
import { AuthInput, PasswordInput, PhoneInput, Screen } from '../../shared/ui';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Masukkan nomor handphone / WhatsApp terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setError('');

    let normalizedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '0' + normalizedPhone.slice(2);
    } else if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    setTimeout(() => {
      setSubmitting(false);
      setStep('verify');
      triggerToast(`Kode verifikasi OTP telah dikirim ke WhatsApp ${normalizedPhone}`, 'success');
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Masukkan kode verifikasi OTP yang valid.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      triggerToast('Kata sandi berhasil diperbarui! Silakan masuk.', 'success');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    }, 1200);
  };

  return (
    <Screen>
      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-xs text-white shadow-2xl transition-all duration-300 sm:text-sm ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 pointer-events-none opacity-0'
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
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <IonIcon icon={closeOutline} className="text-base" />
          </button>
        </div>
      </div>

      <div className="flex min-h-full flex-1 flex-col bg-[#f8fafc] text-slate-800">
        {/* Top Decorative PKM Brand Strip */}
        <div className="flex h-1.5 w-full shrink-0">
          <div className="h-full w-1/3 bg-[#d91424]" />
          <div className="h-full w-1/3 bg-[#ea580c]" />
          <div className="h-full w-1/3 bg-[#0c1d37]" />
        </div>

        {/* Centered Main Forgot Password Container */}
        <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Top Back Navigation & Logo */}
            <div className="mb-5 flex items-center justify-between">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0c1d37] transition-colors"
              >
                <IonIcon icon={arrowBackOutline} className="text-base" />
                <span>Kembali ke Masuk</span>
              </Link>
              <PkmLogo className="size-9 drop-shadow-xs" />
            </div>

            {/* Header Title & Subtitle */}
            <section className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-[#0c1d37]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#0c1d37] uppercase tracking-wider">
                  Bantuan Akun
                </span>
              </div>
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#0c1d37]">
                {step === 'request' ? 'Lupa Kata Sandi' : 'Atur Ulang Sandi'}
              </h1>
              <p className="text-xs leading-relaxed text-slate-500">
                {step === 'request'
                  ? 'Masukkan nomor WhatsApp terdaftar. Kami akan mengirimkan kode verifikasi OTP untuk reset kata sandi.'
                  : `Masukkan kode verifikasi OTP yang dikirim ke nomor WhatsApp Anda dan buat kata sandi baru.`}
              </p>
            </section>

            {/* Error Callout */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#d91424]">
                <IonIcon icon={alertCircleOutline} className="mt-0.5 text-base shrink-0 text-[#d91424]" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Step 1: Request OTP Form */}
            {step === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <PhoneInput
                  label="Nomor Handphone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-slate-600">
                  <div className="mb-1 flex items-center gap-1.5 font-bold text-[#0c1d37]">
                    <IonIcon icon={logoWhatsapp} className="text-base text-emerald-600" />
                    <span>Pengiriman Otomatis via WhatsApp</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Pastikan nomor WhatsApp Anda aktif dan dapat menerima pesan untuk verifikasi.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] hover:from-[#091528] hover:to-[#091528] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#0c1d37]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{submitting ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi WhatsApp'}</span>
                    <IonIcon
                      icon={arrowForwardOutline}
                      className={`text-sm ${submitting ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify & Reset Password Form */}
            {step === 'verify' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <AuthInput
                  label="Kode Verifikasi OTP"
                  hint="(6 digit dari WhatsApp)"
                  icon={keyOutline}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Contoh: 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />

                <PasswordInput
                  label="Kata Sandi Baru"
                  hint="(min. 6 karakter)"
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  label="Konfirmasi Kata Sandi Baru"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Tidak menerima kode?</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast('Kode baru telah dikirim kembali via WhatsApp', 'info');
                    }}
                    className="font-bold text-[#d91424] hover:text-[#ea580c] hover:underline cursor-pointer"
                  >
                    Kirim Ulang Kode
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] hover:from-[#091528] hover:to-[#091528] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#0c1d37]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{submitting ? 'Menyimpan Sandi...' : 'Simpan Kata Sandi Baru'}</span>
                    <IonIcon
                      icon={lockClosedOutline}
                      className={`text-sm ${submitting ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <footer className="mt-5 border-t border-slate-200 pt-4 text-center">
              <p className="text-xs font-medium text-slate-500">
                Sudah ingat kata sandi Anda?{' '}
                <Link
                  to="/login"
                  className="font-extrabold text-[#d91424] hover:text-[#ea580c] hover:underline"
                >
                  Masuk Sekarang
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
