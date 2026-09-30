import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { api } from '../../data/api';
import { formatQty, formatRupiah } from '../../domain/format';
import { paymentStatusLabel } from '../../domain/rules';
import { STATUS_LABELS, STATUS_STEPS, type CustomerOrder } from '../../domain/types';
import { Card, ErrorText, Eyebrow, NavBar, Screen, StickyBar } from '../../shared/ui';

export default function OrderDetailPage() {
  const { uuid } = useParams();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!uuid) {
      return;
    }

    api.order(uuid)
      .then((response) => setOrder(response.data))
      .catch((reason: Error) => setError(reason.message));
  }, [uuid]);

  const cancel = async () => {
    if (!order) {
      return;
    }

    setCancelling(true);
    try {
      const response = await api.cancelOrder(order.uuid);
      setOrder(response.data);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal membatalkan.');
    } finally {
      setCancelling(false);
    }
  };

  const currentIndex = order ? STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]) : -1;

  return (
    <Screen
      header={(
        <NavBar
          title="Daftar pesanan"
          backHref="/tabs/orders"
          end={<span className="font-mono text-xs font-bold text-brand">{order?.code}</span>}
        />
      )}
      footer={order?.can_cancel ? (
        <StickyBar>
          <button
            type="button"
            disabled={cancelling}
            className="w-full rounded-lg border border-danger-line bg-surface py-2.5 text-xs font-medium text-danger disabled:opacity-50"
            onClick={() => void cancel()}
          >
            {cancelling ? 'Membatalkan…' : 'Batalkan pesanan ini'}
          </button>
        </StickyBar>
      ) : null}
    >
      <div className="space-y-4 px-4 py-4">
        <ErrorText>{error}</ErrorText>
        {!order && !error ? <p className="text-xs text-muted">Memuat pesanan…</p> : null}
        {order ? (
          <>
            <Card>
              <Eyebrow>Proyek target</Eyebrow>
              <h1 className="mt-1 font-display text-base font-bold text-ink">{order.project_title}</h1>
            </Card>
            <Card>
              <h2 className="mb-3 font-mono text-xs font-bold tracking-wider text-ink uppercase">Status progres pesanan</h2>
              {order.status === 'CANCELLED' ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-danger-line bg-danger-soft p-3 text-xs font-medium text-danger">
                  <IonIcon icon={closeCircleOutline} />
                  Pesanan ini telah dibatalkan
                </div>
              ) : (
                <ol className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-line">
                  {STATUS_STEPS.map((step, index) => {
                    const passed = currentIndex >= index;
                    return (
                      <li key={step} className="relative flex items-center justify-between text-xs">
                        <span className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${passed ? 'border-brand bg-brand text-surface' : 'border-line bg-surface text-subtle'}`}>
                          {passed ? '✓' : index + 1}
                        </span>
                        <span className={passed ? 'font-bold text-brand' : 'text-subtle'}>{STATUS_LABELS[step]}</span>
                        {passed ? <span className="rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] text-brand">OK</span> : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
            <Card className="space-y-2 text-xs">
              <h2 className="mb-2 font-mono font-bold tracking-wider text-ink uppercase">Rincian pengiriman dan item</h2>
              <div>
                <span className="block text-[10px] text-subtle">Alamat</span>
                <span className="font-semibold text-ink">{order.delivery_address}</span>
              </div>
              <div>
                <span className="block text-[10px] text-subtle">Metode pembayaran</span>
                <span className="font-semibold text-ink">{order.payment_method_label} · {paymentStatusLabel(order.payment_status)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-subtle">Plant pengirim</span>
                <span className="font-semibold text-ink">{order.plant?.name ?? 'Plant'}</span>
              </div>
              <ul className="space-y-1 border-t border-line pt-2">
                {order.items.map((item) => (
                  <li key={`${item.code}-${item.name}`} className="flex justify-between gap-3 text-muted">
                    <span>{item.name} · {formatQty(item.quantity)} {item.unit}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-line pt-2 font-display text-sm font-bold text-brand">
                <span>Total nilai pesanan</span>
                <span>{formatRupiah(order.total_price)}</span>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </Screen>
  );
}
