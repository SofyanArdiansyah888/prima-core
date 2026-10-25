import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  arrowForwardOutline,
  briefcaseOutline,
  calendarOutline,
  checkmarkCircleOutline,
  cubeOutline,
  locationOutline,
  logOutOutline,
  refreshOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { getStaffUser, staffApi } from '../../data/staffApi';
import type { SalesOrderSummary, StaffUser } from '../../domain/types';
import { Card, Screen } from '../../shared/ui';
import PkmLogo from '../../shared/ui/PkmLogo';

export default function SalesOrdersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StaffUser | null>(() => getStaffUser());
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await staffApi.getSalesOrders(tab);
      setOrders(response.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const current = getStaffUser();
    if (!current || current.role !== 'sales') {
      navigate('/login', { replace: true });
      return;
    }
    setUser(current);
    void fetchOrders();
  }, [tab]);

  const handleLogout = () => {
    staffApi.logoutStaff();
    navigate('/login', { replace: true });
  };

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.code.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.delivery_address.toLowerCase().includes(q) ||
      o.project_title.toLowerCase().includes(q)
    );
  });

  return (
    <Screen>
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#0c1d37] px-4 py-3 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PkmLogo className="size-8 drop-shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight">SALES LAPANGAN</span>
                <span className="rounded bg-amber-500 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-950">
                  SURVEI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                {user?.name || 'Petugas Sales'} {user?.branch ? `• ${user.branch.name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 hover:text-white transition-colors"
          >
            <IonIcon icon={logOutOutline} className="text-sm" />
            <span className="text-[11px]">Keluar</span>
          </button>
        </div>

        {/* Segmented Filter Tab */}
        <div className="mt-3 flex gap-1 rounded-xl bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Perlu Verifikasi (Pending)
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Riwayat ACC / Tolak
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <IonIcon
            icon={searchOutline}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor pesanan, nama pemesan, lokasi..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0c1d37] outline-none shadow-2xs"
          />
        </div>

        {/* Refresh Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{filteredOrders.length} pesanan ditemukan</span>
          <button
            type="button"
            onClick={() => void fetchOrders(true)}
            className="flex items-center gap-1 font-semibold text-[#0c1d37] hover:underline"
          >
            <IonIcon icon={refreshOutline} className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Order Cards List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0c1d37] mb-2" />
            <p>Memuat daftar pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <IonIcon icon={cubeOutline} className="text-3xl text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak ada pesanan pada tab ini</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {tab === 'pending'
                ? 'Semua pesanan masuk telah Anda survei & verifikasi.'
                : 'Belum ada riwayat pesanan yang disetujui atau ditolak.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.uuid}
              className="p-4 border-slate-200 bg-white shadow-xs hover:border-[#0c1d37]/40 transition-all cursor-pointer"
              onClick={() => navigate(`/sales/orders/${order.uuid}`)}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                <div>
                  <span className="font-mono text-xs font-black text-[#0c1d37]">
                    {order.code}
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                    {order.customer_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Proyek: {order.project_title}
                  </p>
                </div>

                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wide ${
                    order.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : order.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {order.status === 'PENDING_APPROVAL'
                    ? 'Perlu Survei'
                    : order.status === 'CANCELLED'
                    ? 'Ditolak'
                    : 'Disetujui'}
                </span>
              </div>

              {/* Location & Details */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <IonIcon icon={locationOutline} className="text-sm text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-[11px] leading-tight text-slate-700">
                    {order.delivery_address}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Estimasi: <strong className="text-slate-800">{order.distance_km} km</strong> dari {order.plant?.name || 'Plant'}</span>
                  <span className="font-semibold text-slate-700">
                    {order.items.map((i) => `${i.quantity} ${i.unit}`).join(', ')}
                  </span>
                </div>

                {order.survey_notes && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-900 border border-amber-200">
                    <strong>Catatan Survei:</strong> {order.survey_notes}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#0c1d37]">
                  <span>{order.status === 'PENDING_APPROVAL' ? 'Verifikasi Titik Truk' : 'Lihat Rincian'}</span>
                  <IonIcon icon={arrowForwardOutline} className="text-xs" />
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </Screen>
  );
}
