import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    CheckCircle2,
    XCircle,
    MapPin,
    Building2,
    Truck,
    RotateCcw,
    AlertCircle,
    Info,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

type OrderProps = {
    uuid: string;
    code: string;
    delivery_address: string;
    delivery_lat: number | null;
    delivery_lng: number | null;
    distance_km: number;
    delivery_fee: number;
    survey_notes?: string | null;
    uses_concrete_pump?: boolean;
    batching_plant?: {
        name: string;
        code: string;
        lat?: number | null;
        lng?: number | null;
        concrete_pump_fee?: number | string | null;
    };
    items?: { product?: { category?: string } | null }[];
};

type ApprovalQuote = {
    distance_km: number;
    gps_distance_km: number | null;
    is_distance_manual: boolean;
    delivery_fee: number;
    concrete_pump_fee: number;
    ppn: number;
    total_price: number;
};

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

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

export function LocationVerificationCard({ order }: { order: OrderProps }) {
    const originalLat = Number(order.delivery_lat) || -4.805;
    const originalLng = Number(order.delivery_lng) || 119.561;

    const [lat, setLat] = useState<number>(originalLat);
    const [lng, setLng] = useState<number>(originalLng);
    const [address, setAddress] = useState<string>(order.delivery_address || '');
    const [notes, setNotes] = useState<string>(order.survey_notes || '');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    // Jarak jalan manual (km) — kosong = pakai jarak GPS
    const [manualKm, setManualKm] = useState('');
    const [usesPump, setUsesPump] = useState<boolean>(Boolean(order.uses_concrete_pump));
    const pumpRate = order.items?.[0]?.product?.category === 'readymix' ? Number(order.batching_plant?.concrete_pump_fee ?? 0) : 0;
    const manualKmValue = Number(manualKm);
    const manualKmInvalid = manualKm.trim() !== '' && (!Number.isFinite(manualKmValue) || manualKmValue <= 0 || manualKmValue > 500);
    // Pratinjau ongkir & total dari server (rumus sama dengan saat ACC)
    const [quote, setQuote] = useState<ApprovalQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);

    const plantLat = Number(order.batching_plant?.lat) || -4.800;
    const plantLng = Number(order.batching_plant?.lng) || 119.550;

    const liveDistance = haversineKm(plantLat, plantLng, lat, lng);
    const isPositionChanged = Math.abs(lat - originalLat) > 0.0001 || Math.abs(lng - originalLng) > 0.0001;

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) {
return;
}

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [lat, lng],
                zoom: 14,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                subdomains: ['a', 'b', 'c'],
                attribution: '&copy; OpenStreetMap',
            }).addTo(map);

            // Plant Marker
            const plantIcon = L.divIcon({
                className: 'custom-plant-pin',
                html: `<div style="background-color: #0c1d37; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 14px;">🏭</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            L.marker([plantLat, plantLng], { icon: plantIcon })
                .bindPopup(`<b>${order.batching_plant?.name || 'Batching Plant'}</b><br>Titik Asal Armada`)
                .addTo(map);

            // Draggable Destination Marker for Big Truck Access
            const destIcon = L.divIcon({
                className: 'custom-dest-pin',
                html: `<div style="background-color: #d91424; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); font-size: 15px; cursor: move;">🚚</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            });

            const marker = L.marker([lat, lng], {
                draggable: true,
                icon: destIcon,
            }).addTo(map);

            marker.bindPopup('<b>Titik Bongkar Armada</b><br>Geser pin ke titik jalan yang dapat dilalui truk mixer besar.').openPopup();

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                const newLat = Number(pos.lat.toFixed(7));
                const newLng = Number(pos.lng.toFixed(7));
                setLat(newLat);
                setLng(newLng);
            });

            // Map click to place marker
            map.on('click', (e: L.LeafletMouseEvent) => {
                const newLat = Number(e.latlng.lat.toFixed(7));
                const newLng = Number(e.latlng.lng.toFixed(7));
                setLat(newLat);
                setLng(newLng);
                marker.setLatLng([newLat, newLng]);
            });

            markerRef.current = marker;

            // Route Polyline
            const polyline = L.polyline(
                [[plantLat, plantLng], [lat, lng]],
                { color: '#ea580c', weight: 3, dashArray: '6, 8', opacity: 0.8 }
            ).addTo(map);
            polylineRef.current = polyline;

            // Fit bounds
            const bounds = L.latLngBounds([[plantLat, plantLng], [lat, lng]]);
            map.fitBounds(bounds, { padding: [40, 40] });

            mapInstanceRef.current = map;
        }
    }, []);

    // Update marker and polyline when lat/lng change
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        }

        if (polylineRef.current) {
            polylineRef.current.setLatLngs([[plantLat, plantLng], [lat, lng]]);
        }
    }, [lat, lng, plantLat, plantLng]);

    // Hitung ulang pratinjau ongkir saat jarak aktual, titik, atau CP berubah (debounce)
    useEffect(() => {
        if (manualKmInvalid) {
            return;
        }

        const params = new URLSearchParams({ delivery_lat: String(lat), delivery_lng: String(lng) });

        if (manualKm.trim() !== '') {
            params.set('distance_km', String(manualKmValue));
        }

        if (pumpRate > 0 || order.uses_concrete_pump) {
            params.set('uses_concrete_pump', usesPump ? '1' : '0');
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setQuoteLoading(true);

            try {
                const res = await fetch(`/sales/orders/${order.uuid}/approval-quote?${params}`, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                setQuote(res.ok ? ((await res.json()).data as ApprovalQuote) : null);
            } catch {
                if (!controller.signal.aborted) {
                    setQuote(null);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setQuoteLoading(false);
                }
            }
        }, 400);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [lat, lng, manualKm, manualKmValue, manualKmInvalid, usesPump, pumpRate, order.uuid, order.uses_concrete_pump]);

    const handleReset = () => {
        setLat(originalLat);
        setLng(originalLng);
        setAddress(order.delivery_address || '');

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([originalLat, originalLng], 14);
        }
    };

    const handleApprove = () => {
        setSubmitting(true);
        router.post(
            `/sales/orders/${order.uuid}/approve`,
            {
                delivery_lat: lat,
                delivery_lng: lng,
                delivery_address: address,
                survey_notes: notes,
                distance_km: manualKm.trim() !== '' ? Number(manualKm) : null,
                ...(pumpRate > 0 || order.uses_concrete_pump ? { uses_concrete_pump: usesPump } : {}),
            },
            {
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
return;
}

        setSubmitting(true);
        router.post(
            `/sales/orders/${order.uuid}/reject`,
            {
                rejection_reason: rejectionReason,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    setRejectModalOpen(false);
                },
            }
        );
    };

    return (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-md dark:border-amber-700/60 dark:bg-amber-950/20">
            {/* Header Box */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200/80 pb-3 mb-4 dark:border-amber-900/60">
                <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <Truck className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            Verifikasi &amp; Penyesuaian Titik Lokasi Truk Besar
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Pastikan jalan dan titik bongkar dapat dilalui oleh armada mixer 7m³ / tronton.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isPositionChanged && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                        >
                            <RotateCcw className="size-3.5 mr-1" /> Reset Titik Asal
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        disabled={submitting || manualKmInvalid}
                        onClick={handleApprove}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 shadow-xs"
                    >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        {submitting ? 'Memproses...' : 'Setujui & ACC Lokasi'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => setRejectModalOpen(true)}
                        className="h-8 text-xs font-bold border-red-300 text-[#d91424] hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                    >
                        <XCircle className="size-3.5 mr-1" /> Tolak
                    </Button>
                </div>
            </div>

            {/* Instruction Tip */}
            <div className="mb-4 rounded-xl bg-white border border-amber-200 p-3 text-xs text-slate-700 shadow-2xs flex items-start gap-2.5 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                    <strong>Petunjuk Sales / Approver:</strong> Bila titik pemesan berada di gang kecil, <strong>geser pin merah (🚚)</strong> pada peta ke pinggir jalan raya terdekat tempat truk mixer dapat parkir dan membongkar muatan (misal dengan talang cor atau pompa). Jarak dan ongkir akan otomatis terkalkulasi ulang saat di-ACC.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Map Column */}
                <div className="lg:col-span-7">
                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-inner dark:border-slate-800 h-[360px] relative">
                        <div ref={mapContainerRef} className="w-full h-full z-0" />
                        <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-slate-800 border border-slate-200 shadow-xs flex items-center gap-2">
                            <span>Jarak Estimasi: <strong className="text-emerald-700">{liveDistance} km</strong></span>
                            {isPositionChanged && <span className="text-amber-600 font-extrabold">(Titik Disesuaikan)</span>}
                        </div>
                    </div>
                </div>

                {/* Form Adjustment Column */}
                <div className="lg:col-span-5 space-y-3.5 text-xs">
                    <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Alamat / Patokan Titik Akses Armada:
                        </label>
                        <textarea
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Alamat lengkap titik bongkar..."
                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-[#0c1d37] focus:ring-1 focus:ring-[#0c1d37] outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Latitude:</label>
                            <input
                                type="number"
                                step="any"
                                value={lat}
                                onChange={(e) => setLat(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 focus:border-[#0c1d37] outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Longitude:</label>
                            <input
                                type="number"
                                step="any"
                                value={lng}
                                onChange={(e) => setLng(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 focus:border-[#0c1d37] outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="manual-km" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Jarak Jalan Aktual (km) — opsional:
                        </label>
                        <input
                            id="manual-km"
                            type="number"
                            min={0}
                            step="0.1"
                            value={manualKm}
                            onChange={(e) => setManualKm(e.target.value)}
                            placeholder={`GPS: ${liveDistance} km`}
                            className={`w-full rounded-lg border bg-white p-2 font-mono text-xs text-slate-900 focus:border-[#0c1d37] outline-none dark:bg-slate-900 dark:text-white ${manualKmInvalid ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
                        />
                        <p className={`mt-1 text-[11px] ${manualKmInvalid ? 'font-semibold text-[#d91424]' : 'text-slate-500'}`}>
                            {manualKmInvalid ? 'Isi jarak antara 0,1 – 500 km.' : 'Bila diisi, ongkir dihitung dari km ini (bukan garis lurus GPS).'}
                        </p>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                            Ongkir saat ACC {quoteLoading && <span className="font-normal normal-case text-slate-500">· menghitung…</span>}
                        </p>
                        {quote && !manualKmInvalid ? (
                            <div className={`mt-1 space-y-0.5 ${quoteLoading ? 'opacity-60' : ''}`}>
                                <p className="text-slate-700 dark:text-slate-300">
                                    Jarak dipakai: <strong>{quote.distance_km} km</strong>{' '}
                                    <span className="text-slate-500">({quote.is_distance_manual ? 'jarak aktual' : 'GPS'})</span>
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">
                                    Ongkir: <strong>{rupiah(quote.delivery_fee)}</strong>
                                    {Number(quote.delivery_fee) !== Number(order.delivery_fee) && (
                                        <span className="ml-1 text-slate-400 line-through">{rupiah(Number(order.delivery_fee))}</span>
                                    )}
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">
                                    Total tagihan: <strong>{rupiah(quote.total_price)}</strong>
                                </p>
                            </div>
                        ) : (
                            <p className="mt-1 text-slate-500">{manualKmInvalid ? 'Perbaiki jarak untuk melihat ongkir.' : 'Memuat…'}</p>
                        )}
                    </div>

                    {(pumpRate > 0 || order.uses_concrete_pump) && (
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                            <input type="checkbox" checked={usesPump} onChange={(e) => setUsesPump(e.target.checked)} className="size-4" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Pakai Concrete Pump (CP)
                                {pumpRate > 0 && <span className="ml-1 font-normal text-slate-500">· Rp {pumpRate.toLocaleString('id-ID')}</span>}
                            </span>
                        </label>
                    )}

                    <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Catatan Survei &amp; Akses Jalan (Akan Dilihat Pelanggan &amp; Supir):
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Akses lorong sempit, truk mixer 7m³ parkir di depan gapura lorong. Disarankan menggunakan talang tambahan atau pompa cor."
                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-[#0c1d37] focus:ring-1 focus:ring-[#0c1d37] outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="button"
                            disabled={submitting || manualKmInvalid}
                            onClick={handleApprove}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow-xs"
                        >
                            <ShieldCheck className="size-4 mr-1.5" />
                            {submitting ? 'Menyimpan & Menyetujui...' : 'Verifikasi & Setujui Lokasi (ACC)'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            <ConfirmModal
                open={rejectModalOpen}
                onOpenChange={setRejectModalOpen}
                title="Tolak Pesanan Ini?"
                description="Pesanan akan dibatalkan. Berikan alasan mengapa lokasi atau akses proyek tidak dapat dijangkau armada."
                variant="destructive"
                confirmText={submitting ? 'Menolak...' : 'Konfirmasi Tolak Pesanan'}
                onConfirm={handleReject}
                isLoading={submitting}
                confirmDisabled={!rejectionReason.trim()}
            >
                <div className="mt-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Alasan Penolakan:
                    </label>
                    <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Contoh: Akses jalan tidak dapat dilalui truk mixer, jembatan kayu berkapasitas maksimal 2 ton, dsb."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-red-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                </div>
            </ConfirmModal>
        </div>
    );
}
