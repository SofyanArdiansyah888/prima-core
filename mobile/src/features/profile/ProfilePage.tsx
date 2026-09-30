import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useAuth } from '../../data/auth';
import { BrandBar, Card, ErrorText, Field, PrimaryButton, Screen, TextInput } from '../../shared/ui';

export default function ProfilePage() {
  const { customer, setCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <Screen header={<BrandBar title="Profil pelanggan" />}>
      <form
        className="space-y-4 px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <ErrorText>{error}</ErrorText>
        {saved ? <p className="text-xs text-brand">Profil tersimpan.</p> : null}
        <Card className="space-y-3">
          <Field label="Nama lengkap / perusahaan">
            <TextInput required className="bg-fill" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Nomor HP">
            <TextInput required className="bg-fill font-mono" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="Email">
            <TextInput type="email" className="bg-fill" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <PrimaryButton type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</PrimaryButton>
        </Card>
        <Card>
          <button
            type="button"
            className="w-full rounded-lg bg-fill py-2.5 text-xs font-semibold text-danger"
            onClick={() => {
              void logout().then(() => navigate('/login', { replace: true }));
            }}
          >
            Keluar dari akun
          </button>
        </Card>
      </form>
    </Screen>
  );
}
