import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  locationOutline, 
  cardOutline, 
  checkmarkCircle, 
  arrowForwardOutline,
  createOutline,
  shieldCheckmarkOutline,
  businessOutline
} from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../data/api';
import { useAuth } from '../../data/auth';
import { useCart } from '../../data/cart';
import { formatRupiah } from '../../domain/format';
import type { Quote } from '../../domain/types';
import { 
  Card, 
  ErrorText, 
  Field, 
  NavBar, 
  PrimaryButton, 
  Screen, 
  StickyBar, 
  TextInput 
} from '../../shared/ui';
import { getSavedDeliveryAddress } from './SelectAddressPage';
import { openSnapPayment } from '../../lib/midtrans';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useAuth();
  const { lines, clear } = useCart();

  // Delivery destination from saved address
  const [projectTitle, setProjectTitle] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Load saved address on mount or when returning from SelectAddressPage
  useEffect(() => {
    const saved = getSavedDeliveryAddress();
    if (saved) {
      setProjectTitle(saved.projectTitle);
      setAddress(saved.address);
      setLat(saved.lat);
      setLng(saved.lng);
    } else if (customer?.name) {
      setProjectTitle(`Proyek ${customer.name}`);
    }
  }, [location.state, customer]);

  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Automatically recalculate quote whenever cart items or map coordinates change
  useEffect(() => {
    if (lines.length === 0 || lat === null || lng === null) {
      setQuote(null);
      return;
    }

    setCalculating(true);
    const timer = window.setTimeout(() => {
      api.quote({
        delivery_lat: lat,
        delivery_lng: lng,
        items: lines.map((line) => ({ product_uuid: line.product.uuid, quantity: line.quantity })),
      })
        .then((response) => {
          setQuote(response.data);
          setError('');
        })
        .catch((reason: Error) => {
          setQuote(null);
          setError(reason.message);
        })
        .finally(() => {
          setCalculating(false);
        });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [lines, lat, lng]);

  const submit = async () => {
    if (!address.trim() || lat === null || lng === null) {
      setError('Silakan pilih alamat pengantaran proyek terlebih dahulu.');
      navigate('/select-address');
      return;
    }

    if (!projectTitle.trim()) {
      setError('Harap isi nama proyek atau nama toko pemesan.');
      return;
    }

    if (!quote) {
      setError('Sedang mengalkulasi tarif atau lokasi belum terdeteksi.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await api.createOrder({
        project_title: projectTitle,
        delivery_address: address,
        delivery_lat: lat,
        delivery_lng: lng,
        payment_method: 'MIDTRANS',
        notes: notes || undefined,
        items: lines.map((line) => ({ product_uuid: line.product.uuid, quantity: line.quantity })),
      });

      const orderData = response.data;
      clear();

      // Open Midtrans Snap popup directly
      if (orderData.snap_token) {
        void openSnapPayment(
          orderData.snap_token,
          {
            onSuccess: async () => {
              try {
                await api.syncPayment(orderData.uuid);
              } catch {}
              navigate(`/orders/${orderData.uuid}`);
            },
            onPending: async () => {
              try {
                await api.syncPayment(orderData.uuid);
              } catch {}
              navigate(`/orders/${orderData.uuid}`);
            },
            onError: () => {
              navigate(`/orders/${orderData.uuid}`);
            },
            onClose: () => {
              navigate(`/success/${encodeURIComponent(orderData.code)}`, {
                state: { uuid: orderData.uuid, snap_token: orderData.snap_token },
              });
            },
          },
          orderData.midtrans_client_key || undefined
        );
      } else {
        navigate(`/success/${encodeURIComponent(orderData.code)}`, {
          state: { uuid: orderData.uuid },
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasAddress = Boolean(address.trim() && lat !== null && lng !== null);

  return (
    <Screen
      header={<NavBar title="Konfirmasi & Pembayaran" backHref="/cart" />}
      footer={
        lines.length > 0 ? (
          <StickyBar>
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Total Tagihan Final</span>
                <span className="text-base font-extrabold text-[#d91424]">
                  {quote ? formatRupiah(quote.total_price) : calculating ? 'Menghitung…' : hasAddress ? 'Memuat tarif…' : 'Pilih Alamat Dulu'}
                </span>
              </div>
              {quote && (
                <div className="text-right">
                  <span className="block text-[9px] text-slate-400">Plant Pengirim:</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {quote.plant.name} ({quote.distance_km} km)
                  </span>
                </div>
              )}
            </div>
            
            {hasAddress ? (
              <PrimaryButton 
                type="button" 
                disabled={submitting || lines.length === 0 || !quote || calculating} 
                onClick={() => void submit()}
              >
                <span>{submitting ? 'Menghubungkan Midtrans…' : 'Bayar Sekarang via Midtrans'}</span>
                <IonIcon icon={arrowForwardOutline} className="text-sm" />
              </PrimaryButton>
            ) : (
              <PrimaryButton 
                type="button" 
                onClick={() => navigate('/select-address')}
              >
                <IonIcon icon={locationOutline} className="text-sm" />
                <span>Pilih Alamat Pengantaran</span>
              </PrimaryButton>
            )}
          </StickyBar>
        ) : null
      }
    >
      <form
        className="space-y-3.5 px-4 py-4 pb-32"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <ErrorText>{error}</ErrorText>

        {/* SECTION 1: HASIL PILIH ALAMAT PENGANTARAN */}
        {hasAddress ? (
          <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-[#ea580c] border border-orange-200/60">
                  <IonIcon icon={locationOutline} className="text-base" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                    Alamat Pengantaran
                  </h2>
                  <span className="text-[10px] text-slate-400">Lokasi proyek tujuan armada</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/select-address')}
                className="flex items-center gap-1 text-xs font-bold text-[#ea580c] hover:text-orange-700 bg-orange-50/80 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors cursor-pointer"
              >
                <IonIcon icon={createOutline} className="text-sm" />
                <span>Ubah</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <IonIcon icon={businessOutline} className="text-xs text-slate-500" />
                <span className="font-extrabold text-sm text-[#0c1d37]">
                  {projectTitle || 'Proyek Pemesan'}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                  Proyek
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">
                {address}
              </p>
              {lat !== null && lng !== null && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pl-5 pt-0.5">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                  <span>Koordinat: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-5 border-2 border-dashed border-orange-300 bg-orange-50/40 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-[#ea580c]">
              <IonIcon icon={locationOutline} className="text-2xl" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-[#0c1d37]">Alamat Pengantaran Belum Dipilih</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tentukan titik koordinat proyek Anda pada peta untuk mendeteksi batching plant terdekat dan tarif ongkir armada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/select-address')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1d37] hover:bg-slate-800 py-2.5 px-4 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <IonIcon icon={locationOutline} className="text-base text-[#ea580c]" />
              <span>Pilih Titik Lokasi & Alamat Proyek</span>
            </button>
          </Card>
        )}

        {/* SECTION 2: AUTO-DETECTED BATCHING PLANT CARD */}
        {quote ? (
          <Card className="p-4 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                  <IonIcon icon={checkmarkCircle} />
                </span>
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Batching Plant Otomatis Terpilih
                </span>
              </div>
              <span className="rounded bg-emerald-200/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-900">
                {quote.plant.code}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-sm text-[#0c1d37]">
                  {quote.plant.name}
                </div>
                <p className="text-[11px] text-slate-600">
                  Melayani suplai & pengantaran langsung ke lokasi proyek Anda.
                </p>
              </div>
              <div className="text-right shrink-0 bg-white/80 p-2 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 block">Jarak Radius</span>
                <span className="font-mono font-black text-sm text-[#0c1d37]">
                  {quote.distance_km} <span className="text-[10px] font-sans font-medium">km</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-100">
              <span className="text-slate-600">Estimasi Biaya Pengantaran Armada:</span>
              <span className="font-bold text-[#0c1d37] font-mono">{formatRupiah(quote.delivery_fee)}</span>
            </div>
          </Card>
        ) : calculating ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="animate-spin text-[#ea580c]">⏳</span>
            <span>Mendeteksi batching plant terdekat dan mengalkulasi tarif...</span>
          </div>
        ) : null}

        {/* SECTION 3: METODE PEMBAYARAN */}
        <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#0c1d37] text-white shadow-xs">
                <IonIcon icon={cardOutline} className="text-base" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Metode Pembayaran
                </span>
                <span className="text-xs font-extrabold text-[#0c1d37]">
                  Midtrans Online Payment
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              QRIS & VA Bank
            </span>
          </div>

          <Field label="Catatan Tambahan (Opsional)">
            <TextInput 
              placeholder="Contoh: Akses truk mixer hanya via gerbang barat"
              value={notes} 
              onChange={(event) => setNotes(event.target.value)} 
            />
          </Field>
        </Card>

        {/* SECTION 4: RINCIAN BIAYA SERVER (QUOTE) */}
        {quote && (
          <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                Rincian Biaya Pesanan
              </h2>
            </div>

            <dl className="space-y-1.5 border-b border-slate-100 pb-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal Produk</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ongkos Kirim ({quote.distance_km} km)</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">PPN (11%)</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.ppn)}</dd>
              </div>
              {Number(quote.admin_fee) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Biaya Layanan Pembayaran</dt>
                  <dd className="font-semibold text-slate-800">{formatRupiah(quote.admin_fee)}</dd>
                </div>
              )}
            </dl>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">Total Tagihan Final</span>
              <span className="font-extrabold text-base text-[#d91424]">
                {formatRupiah(quote.total_price)}
              </span>
            </div>

            {quote.details && (
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                {quote.details}
              </p>
            )}
          </Card>
        )}
      </form>
    </Screen>
  );
}
