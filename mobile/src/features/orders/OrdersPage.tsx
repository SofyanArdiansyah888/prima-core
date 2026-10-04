import { useEffect, useState, useMemo } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
import {
  businessOutline,
  chevronForwardOutline,
  cubeOutline,
  documentTextOutline,
  locationOutline,
  receiptOutline,
  searchOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { formatDate, formatQty, formatRupiah } from '../../domain/format';
import { orderStatusTone } from '../../domain/rules';
import type { CustomerOrder } from '../../domain/types';
import { BrandBar, Card, ErrorText, OrderCardSkeleton, Screen, StatusBadge } from '../../shared/ui';

type FilterTab = 'ALL' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.orders();
      setOrders(response?.data || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useIonViewWillEnter(() => {
    void loadOrders();
  });

  const handlePullRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const response = await api.orders();
      setOrders(response.data);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memperbarui data.');
    } finally {
      event.detail.complete();
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      let matchesStatus = true;
      if (activeFilter === 'PROCESSING') {
        matchesStatus = ['DRAFT', 'CONFIRMED', 'WORK_ORDER_CREATED', 'IN_PRODUCTION'].includes(order.status);
      } else if (activeFilter === 'COMPLETED') {
        matchesStatus = ['PARTIAL_DELIVERY', 'COMPLETED'].includes(order.status);
      } else if (activeFilter === 'CANCELLED') {
        matchesStatus = order.status === 'CANCELLED';
      }

      // Query filter
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesStatus;

      const matchesQuery =
        order.code.toLowerCase().includes(query) ||
        order.project_title.toLowerCase().includes(query) ||
        (order.delivery_address && order.delivery_address.toLowerCase().includes(query)) ||
        (order.plant?.name && order.plant.name.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [orders, activeFilter, searchQuery]);

  const filterTabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'ALL', label: 'Semua', count: orders.length },
    {
      id: 'PROCESSING',
      label: 'Diproses',
      count: orders.filter((o) => ['DRAFT', 'CONFIRMED', 'WORK_ORDER_CREATED', 'IN_PRODUCTION'].includes(o.status)).length,
    },
    {
      id: 'COMPLETED',
      label: 'Selesai',
      count: orders.filter((o) => ['PARTIAL_DELIVERY', 'COMPLETED'].includes(o.status)).length,
    },
    {
      id: 'CANCELLED',
      label: 'Batal',
      count: orders.filter((o) => o.status === 'CANCELLED').length,
    },
  ];

  return (
    <Screen onRefresh={handlePullRefresh} header={<BrandBar title="Riwayat Pesanan" />}>
      <div className="space-y-3 px-4 py-4 pb-24">
        <ErrorText>{error}</ErrorText>

        {/* SEARCH BAR & FILTER TABS */}
        <div className="space-y-2.5">
          <div className="relative">
            <IonIcon
              icon={searchOutline}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode pesanan / proyek..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-xs outline-none focus:border-[#0c1d37] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <IonIcon icon={closeCircleOutline} className="text-base" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#0c1d37] text-white border-[#0c1d37] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ORDER LIST / SKELETON / EMPTY STATES */}
        {loading ? (
          <div className="space-y-3 pt-2">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[45vh] flex-col items-center justify-center px-4 text-center"
          >
            <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
              <IonIcon icon={receiptOutline} className="text-3xl" />
            </div>
            <h3 className="text-sm font-extrabold text-[#0c1d37]">
              {searchQuery ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Pesanan'}
            </h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              {searchQuery
                ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
                : activeFilter !== 'ALL'
                ? `Tidak ada pesanan dalam status "${filterTabs.find((f) => f.id === activeFilter)?.label}".`
                : 'Mulai buat pesanan beton atau semen Tonasa sekarang dari katalog.'}
            </p>
            {activeFilter !== 'ALL' || searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/tabs/home')}
                className="mt-4 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-4 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Mulai Belanja
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3 pt-1">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const firstItem = order.items?.[0];
                const extraItemsCount = (order.items?.length || 0) - 1;

                return (
                  <motion.div
                    key={order.uuid}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="overflow-hidden p-0 border border-slate-200/90 shadow-xs hover:border-[#0c1d37]/40 transition-all">
                      {/* CARD TOP BAR */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <IonIcon icon={businessOutline} className="text-slate-400 text-xs" />
                          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">
                            {order.plant?.name || 'Plant Tonasa'}
                          </span>
                        </div>
                        <StatusBadge tone={orderStatusTone(order.status)}>
                          {order.status_label}
                        </StatusBadge>
                      </div>

                      {/* CARD BODY */}
                      <div
                        onClick={() => navigate(`/orders/${order.uuid}`)}
                        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs font-extrabold text-[#0c1d37] tracking-tight">
                              {order.code}
                            </span>
                            <h2 className="mt-0.5 text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                              {order.project_title}
                            </h2>
                            {order.delivery_address && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 line-clamp-1">
                                <IonIcon icon={locationOutline} className="shrink-0 text-slate-400 text-xs" />
                                <span>{order.delivery_address}</span>
                              </p>
                            )}
                          </div>
                          <IonIcon icon={chevronForwardOutline} className="text-slate-400 text-sm shrink-0 mt-1" />
                        </div>

                        {/* Material Preview Snippet */}
                        {firstItem && (
                          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-100/70 px-2.5 py-1.5 text-[11px] text-slate-700">
                            <div className="flex items-center gap-1.5 truncate">
                              <IonIcon icon={cubeOutline} className="text-slate-500 text-xs shrink-0" />
                              <span className="font-bold truncate">{firstItem.name || firstItem.code}</span>
                              <span className="text-slate-500 shrink-0 font-medium">
                                ({formatQty(firstItem.quantity)} {firstItem.unit})
                              </span>
                            </div>
                            {extraItemsCount > 0 && (
                              <span className="text-[10px] font-bold text-[#ea580c] shrink-0 pl-1">
                                +{extraItemsCount} lainnya
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Date Row */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatDate(order.created_at)}
                          </span>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 mr-1">Total:</span>
                            <span className="font-mono font-black text-sm text-[#0c1d37]">
                              {formatRupiah(order.total_price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* QUICK ACTION BUTTONS */}
                      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-white text-center text-xs">
                        <button
                          type="button"
                          onClick={() => navigate(`/tabs/docs?code=${order.code}`)}
                          className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0c1d37] transition-colors cursor-pointer"
                        >
                          <IonIcon icon={documentTextOutline} className="text-xs text-[#0c1d37]" />
                          <span>Dokumen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${order.uuid}`)}
                          className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-[#0c1d37] hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span>Rincian</span>
                          <IonIcon icon={chevronForwardOutline} className="text-[10px]" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Screen>
  );
}
