import { useState } from 'react';
import { callOutline, lockClosedOutline } from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/auth';
import { ErrorText, Field, IconField, PageIntro, PrimaryButton, Screen, TextInput } from '../../shared/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('081300000001');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await login(phone, password);
      navigate('/tabs/home', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal masuk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <form
        className="flex min-h-full flex-col justify-between px-6 pt-16"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <PageIntro
            eyebrow="PKM Tonasa"
            title="Masuk"
            text="Aplikasi pemesanan resmi pelanggan PT Prima Karya Manunggal."
          />
          <div className="space-y-4">
            <ErrorText>{error}</ErrorText>
            <Field label="Nomor HP">
              <IconField icon={callOutline}>
                <TextInput required inputMode="tel" value={phone} placeholder="08xxxxxxxxxx" onChange={(event) => setPhone(event.target.value)} />
              </IconField>
            </Field>
            <Field label="Kata sandi">
              <IconField icon={lockClosedOutline}>
                <TextInput required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </IconField>
            </Field>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? 'Memeriksa…' : 'Masuk ke aplikasi'}
            </PrimaryButton>
          </div>
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-muted">
          Belum punya akun pelanggan?{' '}
          <Link to="/register" className="font-bold text-brand underline">Daftar sekarang</Link>
        </p>
      </form>
    </Screen>
  );
}
