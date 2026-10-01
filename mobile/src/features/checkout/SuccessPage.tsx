import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, walletOutline } from 'ionicons/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, Eyebrow, PrimaryButton, QuietButton, Screen, StatusBadge } from '../../shared/ui';
import { openSnapPayment } from '../../lib/midtrans';

export default function SuccessPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { uuid?: string; snap_token?: string } | null;
  const uuid = state?.uuid;
  const snapToken = state?.snap_token;
  const orderCode = decodeURIComponent(code ?? '');

  const handlePayNow = () => {
    if (snapToken) {
      void openSnapPayment(snapToken, {
        onSuccess: () => {
          if (uuid) navigate(`/orders/${uuid}`);
        },
        onPending: () => {
          if (uuid) navigate(`/orders/${uuid}`);
        },
        onClose: () => {
          if (uuid) navigate(`/orders/${uuid}`);
        },
      });
    } else if (uuid) {
      navigate(`/orders/${uuid}`);
    }
  };

  return (
    <Screen>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
          <IonIcon icon={checkmarkCircleOutline} className="text-4xl" />
        </div>
        <Eyebrow>Pesanan Berhasil Dibuat</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold text-[#0c1d37]">Konfirmasi Pesanan</h1>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
          Pesanan Anda telah tercatat dalam sistem dan dialokasikan ke jadwal batching plant.
        </p>
        <Card className="mt-6 w-full border border-slate-200 shadow-xs">
          <span className="block font-mono text-[10px] text-slate-400">Nomor Registrasi Pesanan</span>
          <p className="mt-1 font-mono text-base font-extrabold tracking-wider text-[#0c1d37]">{orderCode}</p>
          <div className="mt-2 text-[11px] text-slate-500">
            Status awal <StatusBadge tone="warning">Menunggu Verifikasi</StatusBadge>
          </div>
        </Card>
        <div className="mt-8 w-full space-y-2.5">
          {snapToken && (
            <button
              type="button"
              onClick={handlePayNow}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-black text-white shadow-sm transition-all cursor-pointer"
            >
              <IonIcon icon={walletOutline} className="text-base" />
              <span>Buka Pembayaran Midtrans</span>
            </button>
          )}
          {uuid ? (
            <PrimaryButton type="button" onClick={() => navigate(`/orders/${uuid}`)}>
              Lihat Rincian & Status Pesanan
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => navigate('/tabs/orders')}>
              Lihat Riwayat Pesanan
            </PrimaryButton>
          )}
          <QuietButton type="button" onClick={() => navigate('/tabs/home')}>
            Kembali ke Katalog
          </QuietButton>
        </div>
      </div>
    </Screen>
  );
}
