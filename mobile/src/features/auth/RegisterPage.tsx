import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeOutline,
  mailOutline,
  paperPlaneOutline,
  personOutline,
} from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/auth';
import PkmLogo from '../../shared/ui/PkmLogo';
import { AuthInput, PasswordInput, PhoneInput, Screen } from '../../shared/ui';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
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
    setError('');

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      triggerToast('Kata sandi minimal 6 karakter.', 'error');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      triggerToast('Konfirmasi kata sandi tidak cocok.', 'error');
      return;
    }

    setSubmitting(true);

    let normalizedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '0' + normalizedPhone.slice(2);
    } else if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    try {
      await register({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim() || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
      triggerToast('Registrasi berhasil! Selamat datang di PKM Tonasa.', 'success');
      navigate('/tabs/home', { replace: true });
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Gagal mendaftar akun pelanggan.';
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

        {/* Centered Main Register Container */}
        <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Top Back Navigation & Logo */}
            <div className="mb-4 flex items-center justify-between">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0c1d37] transition-colors"
              >
                <IonIcon icon={arrowBackOutline} className="text-base" />
                <span>Kembali</span>
              </Link>
              <PkmLogo className="size-9 drop-shadow-xs" />
            </div>

            {/* Header Title & Subtitle */}
            <section className="mb-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-md bg-[#d91424]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#d91424] uppercase tracking-wider">
                  Akun Baru
                </span>
                <span className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">
                  PT. PKM TONASA
                </span>
              </div>
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#0c1d37]">
                Daftar Pelanggan
              </h1>
              <p className="text-xs leading-relaxed text-slate-500">
                Pendaftaran mandiri untuk pemesanan semen sak & beton ready-mix resmi.
              </p>
            </section>

            {/* Error Callout */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#d91424]">
                <IonIcon icon={alertCircleOutline} className="mt-0.5 text-base shrink-0 text-[#d91424]" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <AuthInput
                label="Nama Lengkap / Nama Toko"
                placeholder="Contoh: H. Ahmad Rusdi / Toko Berkah"
                icon={personOutline}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              <PhoneInput
                label="Nomor Handphone / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <AuthInput
                label="Alamat Email"
                hint="(opsional)"
                type="email"
                inputMode="email"
                placeholder="nama@email.com"
                icon={mailOutline}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <PasswordInput
                label="Kata Sandi"
                hint="(min. 6 karakter)"
                placeholder="Buat kata sandi akun"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <PasswordInput
                label="Konfirmasi Kata Sandi"
                placeholder="Ulangi kata sandi di atas"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                required
              />

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] hover:from-[#091528] hover:to-[#091528] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#0c1d37]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{submitting ? 'Mendaftarkan Akun...' : 'Buat Akun Pelanggan'}</span>
                  <IonIcon
                    icon={arrowForwardOutline}
                    className={`text-sm ${submitting ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </form>

            {/* Footer */}
            <footer className="mt-5 border-t border-slate-200 pt-4 text-center">
              <p className="text-xs font-medium text-slate-500">
                Sudah memiliki akun pelanggan?{' '}
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
