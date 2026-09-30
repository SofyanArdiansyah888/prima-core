import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, Eyebrow, PrimaryButton, QuietButton, Screen, StatusBadge } from '../../shared/ui';

export default function SuccessPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const uuid = (location.state as { uuid?: string } | null)?.uuid;
  const orderCode = decodeURIComponent(code ?? '');

  return (
    <Screen>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-brand-line bg-brand-soft text-brand">
          <IonIcon icon={checkmarkCircleOutline} className="text-4xl" />
        </div>
        <Eyebrow>Pesanan masuk</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">Menunggu konfirmasi</h1>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
          Pesanan tercatat dan sedang diverifikasi oleh admin logistik.
        </p>
        <Card className="mt-6 w-full">
          <span className="block font-mono text-[10px] text-subtle">Nomor pesanan</span>
          <p className="mt-1 font-mono text-base font-bold tracking-wider text-brand">{orderCode}</p>
          <div className="mt-2 text-[11px] text-muted">
            Status awal <StatusBadge tone="warning">Menunggu</StatusBadge>
          </div>
        </Card>
        <div className="mt-8 w-full space-y-2">
          {uuid ? (
            <PrimaryButton type="button" onClick={() => navigate(`/orders/${uuid}`)}>Lihat status pesanan</PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => navigate('/tabs/orders')}>Lihat status pesanan</PrimaryButton>
          )}
          <QuietButton type="button" onClick={() => navigate('/tabs/home')}>Kembali ke katalog</QuietButton>
        </div>
      </div>
    </Screen>
  );
}
