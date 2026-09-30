import { useState } from 'react';
import { useIonViewWillEnter } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatRupiah } from '../../domain/format';
import { orderStatusTone } from '../../domain/rules';
import type { CustomerOrder } from '../../domain/types';
import { BrandBar, Card, ErrorText, Screen, StatusBadge } from '../../shared/ui';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState('');

  useIonViewWillEnter(() => {
    api.orders()
      .then((response) => setOrders(response.data))
      .catch((reason: Error) => setError(reason.message));
  });

  return (
    <Screen header={<BrandBar title="Daftar pesanan" />}>
      <div className="space-y-3 px-4 py-4">
        <ErrorText>{error}</ErrorText>
        {orders.length === 0 ? <p className="text-xs text-muted">Belum ada pesanan.</p> : null}
        {orders.map((order) => (
          <button key={order.uuid} type="button" className="block w-full text-left" onClick={() => navigate(`/orders/${order.uuid}`)}>
            <Card className="p-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-ink">{order.code}</span>
                <StatusBadge tone={orderStatusTone(order.status)}>{order.status_label}</StatusBadge>
              </div>
              <h2 className="text-xs font-bold text-ink">{order.project_title}</h2>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
                <span className="font-mono text-[10px] text-subtle">{formatDate(order.created_at)}</span>
                <span className="font-display font-bold text-brand">{formatRupiah(order.total_price)}</span>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </Screen>
  );
}
