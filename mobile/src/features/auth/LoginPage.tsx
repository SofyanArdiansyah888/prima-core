import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  arrowForwardOutline,
  briefcaseOutline,
  checkmarkCircleOutline,
  closeOutline,
  lockClosedOutline,
  logoWhatsapp,
  paperPlaneOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useAuth } from '../../data/auth';
import { staffApi } from '../../data/staffApi';
import { normalizePhone } from '../../domain/phone';
import PkmLogo from '../../shared/ui/PkmLogo';
import { AuthInput, PasswordInput, PhoneInput, Screen } from '../../shared/ui';

type ToastState = {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function LoginPage() {
  const { login, acceptSession } = useAuth();
  const navigate = useNavigate();

  // Primary Role: 'customer' | 'staff'
  const [roleTab, setRoleTab] = useState<'customer' | 'staff'>('customer');

  // Customer state
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Staff state (Sales / Driver)
  const [staffLogin, setStaffLogin] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

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

  const handleCustomerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const normalizedPhone = normalizePhone(phone);

    if (method === 'otp') {
      try {
        if (!otpSent) {
          await api.requestOtp({ phone: normalizedPhone, purpose: 'login' });
          setOtpSent(true);
          triggerToast(`Kode OTP dikirim via WhatsApp ke ${normalizedPhone}`, 'success');
        } else {
          const response = await api.verifyOtp({ phone: normalizedPhone, code: otpCode.trim() });
          acceptSession(response.token, response.customer);
          triggerToast('Berhasil masuk! Mengalihkan...', 'success');
          navigate('/tabs/home', { replace: true });
        }
      } catch (reason) {
        const msg = reason instanceof Error ? reason.message : 'OTP gagal diproses.';
        setError(msg);
        triggerToast(msg, 'error');
      } finally {
        setSubmitting(false);
      }
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

  const handleStaffSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await staffApi.loginStaff({
        login: staffLogin.trim(),
        password: staffPassword,
      });

      triggerToast(`Selamat datang, ${result.user.name}!`, 'success');

      if (result.user.role === 'sales') {
        navigate('/sales/orders', { replace: true });
      } else if (result.user.role === 'driver') {
        navigate('/driver/deliveries', { replace: true });
      } else {
        triggerToast('Role akun staf tidak dikenali.', 'error');
      }
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Login staf lapangan gagal.';
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
            <header className="mb-4 flex items-center">
              <div className="flex items-center gap-3.5">
                <PkmLogo className="size-12 drop-shadow-md" />
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-[#0c1d37]">
                      PRIMA
                    </span>
                    <span className="rounded bg-[#d91424] px-1.5 py-0.5 text-[9px] font-black italic text-white tracking-wider">
                      MOBILE
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#ea580c] uppercase tracking-wider mt-0.5">
                    PT. Prima Karya Manunggal
                  </p>
                </div>
              </div>
            </header>

            {/* Role Selector Tabs (Customer vs Field Staff) */}
            <div className="mb-4 rounded-2xl bg-slate-200/80 p-1 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setRoleTab('customer');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  roleTab === 'customer'
                    ? 'bg-white text-[#0c1d37] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IonIcon icon={personOutline} className="text-sm" />
                <span>Pelanggan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleTab('staff');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  roleTab === 'staff'
                    ? 'bg-[#0c1d37] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IonIcon icon={briefcaseOutline} className="text-sm text-amber-400" />
                <span className="whitespace-nowrap">Sales / Sopir</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <section className="mb-4">
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#0c1d37]">
                {roleTab === 'customer' ? 'Masuk Pelanggan' : 'Masuk Staf Lapangan'}
              </h1>
              <p className="text-xs leading-relaxed text-slate-500">
                {roleTab === 'customer'
                  ? 'Pemesanan semen sak & beton ready-mix resmi PT. Prima Karya Manunggal.'
                  : 'Akses khusus petugas Sales (survei akses jalan) & Supir (surat jalan e-POD).'}
              </p>
            </section>

            {/* Error Callout */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#d91424]">
                <IonIcon icon={alertCircleOutline} className="mt-0.5 text-base shrink-0 text-[#d91424]" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* CUSTOMER LOGIN FORM */}
            {roleTab === 'customer' ? (
              <>
                {/* Login Method Tabs */}
                <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('password');
                      setError('');
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${
                      method === 'password'
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
                      setOtpSent(false);
                      setOtpCode('');
                      setError('');
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${
                      method === 'otp'
                        ? 'bg-white text-[#0c1d37] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <IonIcon icon={logoWhatsapp} className="text-sm text-emerald-600" />
                    <span>OTP WhatsApp</span>
                  </button>
                </div>

                <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
                  <PhoneInput
                    label="Nomor Handphone / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

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

                  {method === 'otp' && !otpSent && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
                      <div className="mb-1 flex items-center gap-2 font-bold text-amber-950">
                        <IonIcon icon={logoWhatsapp} className="text-base text-emerald-600" />
                        <span>Verifikasi Cepat via WhatsApp</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        Kode verifikasi 6-digit OTP akan dikirimkan langsung ke nomor WhatsApp Anda saat tombol ditekan.
                      </p>
                    </div>
                  )}

                  {method === 'otp' && otpSent && (
                    <AuthInput
                      label="Kode OTP"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  )}

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
                            : otpSent
                            ? 'Memverifikasi OTP...'
                            : 'Mengirim OTP...'
                          : method === 'password'
                          ? 'Masuk ke Aplikasi'
                          : otpSent
                          ? 'Masuk dengan OTP'
                          : 'Kirim Kode OTP WhatsApp'}
                      </span>
                      <IonIcon icon={arrowForwardOutline} className={`text-sm ${submitting ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </form>

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
                </footer>
              </>
            ) : (
              /* STAFF (SALES / DRIVER) LOGIN FORM */
              <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-2xs flex items-start gap-2">
                  <IonIcon icon={shieldCheckmarkOutline} className="text-base text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Masuk dengan kredensial staf yang telah didaftarkan oleh Admin PKM (Email atau Nomor Handphone).
                  </p>
                </div>

                <AuthInput
                  label="Nomor Handphone atau Email Staf"
                  type="text"
                  placeholder="Contoh: 081241129902 atau sales@pkm.test"
                  value={staffLogin}
                  onChange={(e) => setStaffLogin(e.target.value)}
                  autoComplete="username"
                  required
                />

                <PasswordInput
                  label="Kata Sandi Staf"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 hover:from-amber-700 hover:to-amber-800 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-amber-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{submitting ? 'Memverifikasi Staf...' : 'Masuk Portal Lapangan'}</span>
                    <IonIcon icon={arrowForwardOutline} className={`text-sm ${submitting ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-[10px] text-slate-400">
              &copy; {new Date().getFullYear()} PT. Prima Karya Manunggal • Semen Tonasa Group.
            </p>
          </div>
        </div>
      </div>
    </Screen>
  );
}
