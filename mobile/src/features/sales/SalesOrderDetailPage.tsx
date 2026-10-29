import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeOutline,
  informationCircleOutline,
  locationOutline,
  navigateOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  trashOutline,
} from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useParams } from 'react-router-dom';
import { staffApi } from '../../data/staffApi';
import { formatRupiah } from '../../domain/format';
import type { SalesOrderSummary } from '../../domain/types';
import { Card, Screen } from '../../shared/ui';

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Perlu Survei',
  CONFIRMED: 'Disetujui',
  PROCESSING: 'Diproses',
  ON_DELIVERY: 'Dalam Pengiriman',
  COMPLETED: 'Selesai',
  CANCELLED: 'Ditolak / Batal',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export default function SalesOrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<SalesOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [lat, setLat] = useState<number>(-5.112);
  const [lng, setLng] = useState<number>(119.489);
  const [address, setAddress] = useState('');
  const [surveyNotes, setSurveyNotes] = useState('');

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Leaflet map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const plantLat = order?.plant?.lat ?? -5.112;
  const plantLng = order?.plant?.lng ?? 119.489;
  const liveDistance = haversineKm(plantLat, plantLng, lat, lng);

  const fetchDetail = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const res = await staffApi.getSalesOrderDetail(uuid);
      const data = res.data;
      setOrder(data);
      const initialLat = data.delivery_lat ?? plantLat;
      const initialLng = data.delivery_lng ?? plantLng;
      setLat(initialLat);
      setLng(initialLng);
      setAddress(data.delivery_address || '');
      setSurveyNotes(data.survey_notes || '');
    } catch (e: any) {
      setError(e.message || 'Gagal memuat detail pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [uuid]);

  // Leaflet Map Init
  useEffect(() => {
    if (!mapContainerRef.current || !order) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Plant Icon
      const plantIcon = L.divIcon({
        className: 'plant-pin',
        html: `<div style="background-color: #0c1d37; color: white; border-radius: 9999px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">🏭</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([plantLat, plantLng], { icon: plantIcon })
        .bindPopup(`<b>${order.plant?.name || 'Batching Plant'}</b><br>Titik Asal Armada`)
        .addTo(map);

      // Draggable Truck Mixer Pin
      const truckIcon = L.divIcon({
        className: 'truck-pin',
        html: `<div style="background-color: #d91424; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.5); cursor: move;">🚚</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([lat, lng], {
        draggable: order.status === 'PENDING_APPROVAL',
        icon: truckIcon,
      }).addTo(map);

      marker.bindPopup('<b>Titik Bongkar Armada Truk</b><br>Geser ke jalan yang muat untuk truk mixer besar.');

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLat(Number(pos.lat.toFixed(6)));
        setLng(Number(pos.lng.toFixed(6)));
      });

      markerRef.current = marker;

      // Polyline route
      const polyline = L.polyline([[plantLat, plantLng], [lat, lng]], {
        color: '#ea580c',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(map);
      polylineRef.current = polyline;

      // Fit bounds
      const bounds = L.latLngBounds([[plantLat, plantLng], [lat, lng]]);
      map.fitBounds(bounds, { padding: [30, 30] });

      mapInstanceRef.current = map;
    }
  }, [order]);

  // Update map pin & route
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (polylineRef.current) {
      polylineRef.current.setLatLngs([[plantLat, plantLng], [lat, lng]]);
    }
  }, [lat, lng, plantLat, plantLng]);

  const handleApprove = async () => {
    if (!uuid) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await staffApi.approveSalesOrder(uuid, {
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_address: address,
        survey_notes: surveyNotes,
      });
      setSuccessMsg(res.message);
      setOrder(res.data);
      setTimeout(() => navigate('/sales/orders', { replace: true }), 1500);
    } catch (e: any) {
      setError(e.message || 'Gagal menyetujui pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!uuid || !rejectionReason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await staffApi.rejectSalesOrder(uuid, {
        rejection_reason: rejectionReason.trim(),
      });
      setSuccessMsg(res.message);
      setRejectModalOpen(false);
      setOrder(res.data);
      setTimeout(() => navigate('/sales/orders', { replace: true }), 1500);
    } catch (e: any) {
      setError(e.message || 'Gagal menolak pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0c1d37] mb-2" />
          <p>Memuat peta & detail pesanan...</p>
        </div>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <div className="p-4 text-center">
          <p className="text-xs text-red-600">Pesanan tidak ditemukan.</p>
          <button
            type="button"
            onClick={() => navigate('/sales/orders')}
            className="mt-3 text-xs font-bold text-[#0c1d37] underline"
          >
            Kembali ke Daftar
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-[#0c1d37] px-4 py-3 text-white shadow-md">
        <button
          type="button"
          onClick={() => navigate('/sales/orders')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white"
        >
          <IonIcon icon={arrowBackOutline} className="text-base" />
          <span>Kembali</span>
        </button>

        <span className="font-mono text-xs font-black text-amber-400">
          {order.code}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Banner Status */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800">
            <IonIcon icon={checkmarkCircleOutline} className="text-base text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-300 p-3 text-xs text-[#d91424]">
            <IonIcon icon={alertCircleOutline} className="text-base text-[#d91424] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Order Summary Card */}
        <Card className="p-3.5 border-slate-200 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemesan</p>
              <h2 className="text-sm font-black text-slate-900">{order.customer_name}</h2>
              <p className="text-xs text-slate-600">{order.customer_phone}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black ${
                order.status === 'PENDING_APPROVAL'
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : order.status === 'CANCELLED'
                  ? 'border-red-200 bg-red-100 text-red-700'
                  : 'border-emerald-200 bg-emerald-100 text-emerald-800'
              }`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p><strong>Proyek:</strong> {order.project_title}</p>
            <p><strong>Total Muatan:</strong> {order.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}</p>
            {order.delivery_fee !== undefined && (
              <p><strong>Ongkir:</strong> {formatRupiah(order.delivery_fee)} · <strong>Total:</strong> {formatRupiah(order.total_price)}</p>
            )}
          </div>
        </Card>

        {/* Interactive Map Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-extrabold text-slate-800">
              Verifikasi Akses Truk Mixer Besar (🚚)
            </label>
            <span className="font-bold text-emerald-700">
              Jarak: {liveDistance} km
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-slate-100 shadow-sm h-64">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            {order.status === 'PENDING_APPROVAL' && (
              <div className="pointer-events-none absolute left-2 right-2 top-2 z-[500] ml-10 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-xs backdrop-blur-xs">
                📍 Geser pin merah (🚚) ke jalan yang muat untuk truk mixer. Ongkir dihitung ulang saat ACC.
              </div>
            )}
          </div>
        </div>

        {/* Adjustment Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Alamat Titik Akses / Pembongkaran:
            </label>
            <textarea
              rows={2}
              value={address}
              disabled={order.status !== 'PENDING_APPROVAL'}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat jalan akses armada..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-[#0c1d37] outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Catatan Hasil Survei Lapangan:
            </label>
            <textarea
              rows={3}
              value={surveyNotes}
              disabled={order.status !== 'PENDING_APPROVAL'}
              onChange={(e) => setSurveyNotes(e.target.value)}
              placeholder="Contoh: Gang sempit, truk mixer parkir di depan gapura jalan poros. Diperlukan pompa cor / talang tambahan."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-[#0c1d37] outline-none"
            />
          </div>

          {/* Action Buttons (Only if PENDING_APPROVAL) */}
          {order.status === 'PENDING_APPROVAL' ? (
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-black text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <IonIcon icon={shieldCheckmarkOutline} className="text-base" />
                <span>{submitting ? 'Memproses...' : 'Setujui & ACC Lokasi'}</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setRejectModalOpen(true)}
                className="rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 py-3 px-4 text-xs font-black text-[#d91424] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                Tolak
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-100 p-3 text-center text-xs text-slate-600 border border-slate-200">
              Pesanan ini telah diproses (Status: <strong>{STATUS_LABEL[order.status] ?? order.status}</strong>).
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#d91424]">Tolak Pesanan Ini?</h3>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <IonIcon icon={closeOutline} className="text-lg" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Berikan alasan penolakan mengapa lokasi proyek tidak dapat dijangkau oleh armada:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Akses jalan tidak muat truk mixer, jembatan kayu lapuk maksimal 2 ton..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-red-500"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || submitting}
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white disabled:opacity-60"
              >
                {submitting ? 'Menolak...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
