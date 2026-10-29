import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  callOutline,
  checkmarkCircleOutline,
  closeOutline,
  cubeOutline,
  locationOutline,
  logOutOutline,
  navigateOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { getStaffUser, staffApi } from '../../data/staffApi';
import type { DriverDeliverySummary, StaffUser } from '../../domain/types';
import { Card, Screen } from '../../shared/ui';
import PkmLogo from '../../shared/ui/PkmLogo';

const VEHICLE_LABEL: Record<string, string> = {
  MIXER_TRUCK_7M3: 'Truk Mixer 7 m³',
  BULK_CARRIER_300T: 'Truk Kapsul Curah',
  FLATBED_SAK: 'Truk Flatbed Sak',
  LIGHT_TRUCK: 'Truk Ringan',
};

export default function DriverDeliveriesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StaffUser | null>(() => getStaffUser());
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [deliveries, setDeliveries] = useState<DriverDeliverySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Complete Delivery Modal State
  const [selectedSj, setSelectedSj] = useState<DriverDeliverySummary | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDeliveries = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await staffApi.getDriverDeliveries(tab);
      setDeliveries(res.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const current = getStaffUser();
    if (!current || current.role !== 'driver') {
      navigate('/login', { replace: true });
      return;
    }
    setUser(current);
    void fetchDeliveries();
  }, [tab]);

  const handleLogout = () => {
    staffApi.logoutStaff();
    navigate('/login', { replace: true });
  };

  const handleOpenCompleteModal = (sj: DriverDeliverySummary) => {
    setSelectedSj(sj);
    setRecipientName('');
    setDeliveryNotes('');
  };

  const handleConfirmComplete = async () => {
    if (!selectedSj || !recipientName.trim()) return;
    setSubmitting(true);
    try {
      const res = await staffApi.completeDriverDelivery(selectedSj.uuid, {
        recipient_name: recipientName.trim(),
        notes: deliveryNotes.trim() || undefined,
      });

      setToastMessage(res.message || 'Pengantaran berhasil diselesaikan.');
      setSelectedSj(null);
      void fetchDeliveries(true);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (e: any) {
      alert(e.message || 'Gagal menyelesaikan pengantaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#0c1d37] px-4 py-3 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PkmLogo className="size-8 drop-shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight">SOPIR ARMADA</span>
                <span className="rounded bg-emerald-500 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-950">
                  LOGISTIK
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                {user?.name || 'Pak Sopir'} {user?.branch ? `• ${user.branch.name}` : ''}
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

        {/* Tab switch */}
        <div className="mt-3 flex gap-1 rounded-xl bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'active'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Pengantaran Aktif
          </button>
          <button
            type="button"
            onClick={() => setTab('completed')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Riwayat Selesai
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 shadow-sm">
            <IonIcon icon={checkmarkCircleOutline} className="text-base text-emerald-600 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{deliveries.length} Surat Jalan ditugaskan</span>
          <button
            type="button"
            onClick={() => void fetchDeliveries(true)}
            className="flex items-center gap-1 font-semibold text-[#0c1d37] hover:underline"
          >
            <IonIcon icon={refreshOutline} className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0c1d37] mb-2" />
            <p>Memuat surat jalan armada...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <IonIcon icon={cubeOutline} className="text-3xl text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak ada pengantaran pada tab ini</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {tab === 'active'
                ? 'Belum ada Surat Jalan ritase aktif yang ditugaskan ke armada Anda.'
                : 'Riwayat pengantaran selesai belum ada.'}
            </p>
          </div>
        ) : (
          deliveries.map((sj) => {
            const firstItem = sj.items[0];
            const hasCoords = firstItem?.destination_lat && firstItem?.destination_lng;
            const mapsUrl = hasCoords
              ? `https://www.google.com/maps/dir/?api=1&destination=${firstItem.destination_lat},${firstItem.destination_lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firstItem?.destination_address || '')}`;

            return (
              <Card
                key={sj.uuid}
                className="p-4 border-slate-200 bg-white shadow-xs space-y-3"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-black text-[#0c1d37]">
                      {sj.code}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 mt-0.5">
                      {sj.vehicle_number} • {VEHICLE_LABEL[sj.vehicle_type] ?? sj.vehicle_type.replaceAll('_', ' ')}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Asal: {sj.plant?.name || 'Plant'}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                      sj.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sj.status === 'COMPLETED' ? 'Selesai' : 'Perjalanan'}
                  </span>
                </div>

                {/* Items & Destination */}
                <div className="space-y-2 text-xs">
                  {sj.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.destination_customer_name}</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          {item.quantity_delivered} {item.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.product_name}</p>
                      <div className="flex items-start gap-1 text-[11px] text-slate-600 pt-0.5">
                        <IonIcon icon={locationOutline} className="text-sm text-red-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{item.destination_address}</span>
                      </div>

                      {item.recipient_name && (
                        <p className="text-[10px] text-emerald-800 pt-1 border-t border-slate-200">
                          Penerima: <strong>{item.recipient_name}</strong> ({item.received_at ? new Date(item.received_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''})
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons for Active SJ */}
                {sj.status !== 'COMPLETED' && (
                  <div className="pt-2 flex gap-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 py-2.5 px-3 text-xs font-bold text-blue-700 shadow-2xs active:scale-[0.98] transition-all"
                    >
                      <IonIcon icon={navigateOutline} className="text-base text-blue-600" />
                      <span>Buka Google Maps</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenCompleteModal(sj)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-black text-white shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <IonIcon icon={shieldCheckmarkOutline} className="text-base" />
                      <span>Selesaikan (e-POD)</span>
                    </button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Complete Delivery Modal */}
      {selectedSj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0c1d37]">Selesaikan Pengantaran</h3>
              <button
                type="button"
                onClick={() => setSelectedSj(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <IonIcon icon={closeOutline} className="text-lg" />
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              Pastikan muatan beton telah selesai dibongkar di lokasi proyek dan diserahterimakan kepada penanggung jawab lapangan.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Penerima / Mandor Proyek:
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Contoh: Pak Mandor Rustam / Pak Ahmad"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0c1d37]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Serah Terima (Opsional):
              </label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Contoh: Pengecoran selesai, talang tambahan dikembalikan..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0c1d37]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedSj(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!recipientName.trim() || submitting}
                onClick={handleConfirmComplete}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Konfirmasi Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
