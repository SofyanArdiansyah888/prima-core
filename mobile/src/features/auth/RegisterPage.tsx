import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/auth';
import { ErrorText, Eyebrow, Field, PageIntro, PrimaryButton, Screen, TextInput } from '../../shared/ui';

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

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await register({
        name,
        phone,
        email: email || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/tabs/home', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal mendaftar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <form
        className="flex min-h-full flex-col justify-between px-6 pt-6 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Link to="/login" className="text-muted" aria-label="Kembali">
              <IonIcon icon={chevronBackOutline} className="text-xl" />
            </Link>
            <Eyebrow>PKM Tonasa</Eyebrow>
          </div>
          <PageIntro title="Daftar" text="Registrasi mandiri untuk toko atau pengelola proyek." />
          <div className="space-y-3">
            <ErrorText>{error}</ErrorText>
            <Field label="Nama lengkap / pemilik toko">
              <TextInput required value={name} placeholder="H. Ahmad Rusdi" onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Nomor HP (aktif WA)">
              <TextInput required inputMode="tel" className="font-mono" value={phone} placeholder="0812xxxxxxxx" onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="Email" hint="(opsional)">
              <TextInput type="email" value={email} placeholder="nama@email.com" onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Kata sandi">
              <TextInput required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Field label="Ulangi kata sandi">
              <TextInput required type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            </Field>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? 'Mendaftar…' : 'Buat akun pelanggan'}
            </PrimaryButton>
          </div>
        </div>
        <p className="py-3 text-center text-[11px] text-muted">
          Sudah punya akun? <Link to="/login" className="font-semibold text-brand underline">Masuk</Link>
        </p>
      </form>
    </Screen>
  );
}
