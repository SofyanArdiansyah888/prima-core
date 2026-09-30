import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { 
  personOutline, 
  callOutline, 
  mailOutline, 
  logOutOutline, 
  checkmarkCircle,
  shieldCheckmarkOutline 
} from 'ionicons/icons';
import { api } from '../../data/api';
import { useAuth } from '../../data/auth';
import { 
  BrandBar, 
  Card, 
  ConfirmModal, 
  ErrorText, 
  Field, 
  PrimaryButton, 
  ProfileSkeleton, 
  Screen, 
  TextInput 
} from '../../shared/ui';

export default function ProfilePage() {
  const { customer, setCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await api.updateMe({ name, phone, email: email || null });
      setCustomer(response.data);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <Screen header={<BrandBar title="Profil Akun" />}>
      {!customer && !name ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-3.5 px-4 py-4 pb-24">
          
          {/* AVATAR HERO CARD */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-[#0c1d37] p-4 text-white shadow-xs">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ea580c] to-[#d91424] font-extrabold text-base text-white shadow-md">
              {getInitials(name || customer?.name || 'Pelanggan')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider">
                  Pelanggan Terverifikasi
                </span>
                <IonIcon icon={shieldCheckmarkOutline} className="text-xs text-emerald-400" />
              </div>
              <h2 className="text-sm font-extrabold text-white truncate mt-0.5">
                {name || customer?.name || 'Pelanggan PKM'}
              </h2>
              <p className="text-[11px] font-mono text-slate-300 truncate">
                {phone || customer?.phone}
              </p>
            </div>
          </div>

          <ErrorText>{error}</ErrorText>

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
              <IonIcon icon={checkmarkCircle} className="text-base text-emerald-600 shrink-0" />
              <span>Perubahan data profil berhasil disimpan.</span>
            </div>
          )}

          <form
            className="space-y-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <Card className="space-y-3.5 p-4 border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide border-b border-slate-100 pb-2">
                Informasi Kontak & Perusahaan
              </h3>

              <Field label="Nama Lengkap / Perusahaan">
                <div className="relative">
                  <IonIcon icon={personOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400 pointer-events-none" />
                  <TextInput 
                    required 
                    className="pl-9"
                    value={name} 
                    onChange={(event) => setName(event.target.value)} 
                  />
                </div>
              </Field>

              <Field label="Nomor WhatsApp / HP">
                <div className="relative">
                  <IonIcon icon={callOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400 pointer-events-none" />
                  <TextInput 
                    required 
                    className="pl-9 font-mono"
                    value={phone} 
                    onChange={(event) => setPhone(event.target.value)} 
                  />
                </div>
              </Field>

              <Field label="Alamat Email" hint="Opsional">
                <div className="relative">
                  <IonIcon icon={mailOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400 pointer-events-none" />
                  <TextInput 
                    type="email" 
                    className="pl-9"
                    placeholder="email@perusahaan.com"
                    value={email} 
                    onChange={(event) => setEmail(event.target.value)} 
                  />
                </div>
              </Field>

              <PrimaryButton type="submit" disabled={saving}>
                <span>{saving ? 'Menyimpan Perubahan…' : 'Simpan Profil'}</span>
              </PrimaryButton>
            </Card>

            <Card className="p-3 border border-slate-200/90 shadow-xs">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 py-3 text-xs font-bold text-[#d91424] transition-colors cursor-pointer"
                onClick={() => setShowLogoutModal(true)}
              >
                <IonIcon icon={logOutOutline} className="text-base" />
                <span>Keluar dari Akun</span>
              </button>
            </Card>
          </form>
        </div>
      )}

      {/* Confirmation Logout Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Keluar dari Akun?"
        description="Apakah Anda yakin ingin keluar dari akun PKM Tonasa pada perangkat ini?"
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
        tone="danger"
        iconType="logout"
        onConfirm={() => {
          void logout().then(() => navigate('/login', { replace: true }));
        }}
        onClose={() => setShowLogoutModal(false)}
      />
    </Screen>
  );
}
