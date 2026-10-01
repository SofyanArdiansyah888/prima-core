import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  locationOutline, 
  cardOutline, 
  cashOutline, 
  businessOutline, 
  checkmarkCircle, 
  documentTextOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  navigateOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useAuth } from '../../data/auth';
import { useCart } from '../../data/cart';
import { formatRupiah } from '../../domain/format';
import { PAYMENTS, type Quote } from '../../domain/types';
import { 
  Card, 
  ErrorText, 
  Field, 
  NavBar, 
  PrimaryButton, 
  Screen, 
  StickyBar, 
  TextArea, 
  TextInput 
} from '../../shared/ui';
import { DeliveryMapPicker, type DeliveryLocation } from './DeliveryMapPicker';
import { openSnapPayment } from '../../lib/midtrans';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { lines, clear } = useCart();

  // User delivery destination & project info
  const [projectTitle, setProjectTitle] = useState(
    customer?.name ? `Proyek ${customer.name}` : ''
  );
  const [address, setAddress] = useState('');
  
  // Default coordinates (Makassar center)
  const [lat, setLat] = useState<number>(-5.1477);
  const [lng, setLng] = useState<number>(119.4327);

  const [payment, setPayment] = useState<string>('MIDTRANS');
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

  const handleLocationChange = (loc: DeliveryLocation) => {
    setLat(loc.lat);
    setLng(loc.lng);
    if (loc.roadAddress) {
      setAddress(loc.roadAddress);
    } else if (loc.areaName) {
      setAddress(loc.areaName);
    }
  };

  const submit = async () => {
    if (!projectTitle.trim() || !address.trim()) {
      setError('Harap lengkapi nama proyek dan alamat tujuan pengantaran.');
      return;
    }

    if (lat === null || lng === null || !quote) {
      setError('Silakan tentukan titik lokasi pengantaran pada peta.');
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
        payment_method: payment,
        notes: notes || undefined,
        items: lines.map((line) => ({ product_uuid: line.product.uuid, quantity: line.quantity })),
      });

      const orderData = response.data;
      clear();

      // If Midtrans is selected and snap_token is returned, open Snap popup
      if (payment === 'MIDTRANS' && orderData.snap_token) {
        void openSnapPayment(
          orderData.snap_token,
          {
            onSuccess: () => {
              navigate(`/orders/${orderData.uuid}`);
            },
            onPending: () => {
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

  return (
    <Screen
      header={<NavBar title="Pengiriman & Pembayaran" backHref="/cart" />}
      footer={
        lines.length > 0 ? (
          <StickyBar>
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Total Tagihan Final</span>
                <span className="text-base font-extrabold text-[#d91424]">
                  {quote ? formatRupiah(quote.total_price) : calculating ? 'Menghitung...' : 'Tentukan Lokasi'}
                </span>
              </div>
              {quote && (
                <div className="text-right">
                  <span className="block text-[9px] text-slate-400">Plant Terpilih:</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {quote.plant.name} ({quote.distance_km} km)
                  </span>
                </div>
              )}
            </div>
            <PrimaryButton 
              type="button" 
              disabled={submitting || lines.length === 0 || !quote || calculating} 
              onClick={() => void submit()}
            >
              <span>{submitting ? 'Memproses Pesanan…' : 'Konfirmasi & Buat Pesanan'}</span>
              <IonIcon icon={arrowForwardOutline} className="text-sm" />
            </PrimaryButton>
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

        {/* STEP 1: PETA INTERAKTIF & ALAMAT PENGANTARAN */}
        <Card className="space-y-3.5 p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#0c1d37] text-[10px] font-bold text-white">
                1
              </span>
              <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                Titik Pengantaran & Proyek Anda
              </h2>
            </div>
          </div>

          {/* Interactive Delivery Map Picker */}
          <DeliveryMapPicker lat={lat} lng={lng} onChange={handleLocationChange} />

          {/* Form Fields: Project Title & Detailed Address */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <Field label="Nama Proyek / Toko Pemesan" hint="Bisa diubah">
              <TextInput 
                required 
                placeholder="Contoh: Proyek Ruko Panakkukang / Toko Bangunan Berkah"
                value={projectTitle} 
                onChange={(event) => setProjectTitle(event.target.value)} 
              />
            </Field>

            <Field label="Alamat Lengkap Pengantaran" hint="Sertakan patokan">
              <TextArea 
                required 
                rows={2} 
                placeholder="Jl. Boulevard No. 12, Panakkukang, Makassar (Depan Mall)"
                value={address} 
                onChange={(event) => setAddress(event.target.value)} 
              />
            </Field>
          </div>
        </Card>

        {/* STEP 2: AUTO-DETECTED BATCHING PLANT CARD */}
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
                  Melayani pengiriman langsung ke titik lokasi proyek Anda.
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

        {/* STEP 3: METODE PEMBAYARAN */}
        <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#0c1d37] text-[10px] font-bold text-white">
              2
            </span>
            <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
              Metode Pembayaran
            </h2>
          </div>

          <div className="space-y-2.5">
            {PAYMENTS.map((method) => {
              const selected = payment === method.value;
              const isMidtrans = method.value === 'MIDTRANS';
              return (
                <label 
                  key={method.value} 
                  className={`flex items-start justify-between rounded-xl border p-3.5 text-xs transition-all cursor-pointer ${
                    selected 
                      ? 'border-[#0c1d37] bg-slate-50/90 font-medium text-[#0c1d37] shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-lg mt-0.5 ${
                      selected ? 'bg-[#0c1d37] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <IonIcon 
                        icon={isMidtrans ? cardOutline : cashOutline} 
                        className="text-base" 
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{method.label}</span>
                        <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          isMidtrans ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {method.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {method.sublabel}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    className="accent-[#0c1d37] size-4 cursor-pointer mt-1 shrink-0 ml-2"
                    checked={selected}
                    onChange={() => setPayment(method.value)}
                  />
                </label>
              );
            })}
          </div>

          <Field label="Catatan Tambahan (Opsional)" hint="Untuk driver / QC">
            <TextInput 
              placeholder="Contoh: Akses truk mixer hanya via gerbang barat"
              value={notes} 
              onChange={(event) => setNotes(event.target.value)} 
            />
          </Field>
        </Card>

        {/* STEP 4: RINGKASAN BIAYA SERVER (QUOTE) */}
        {quote && (
          <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0c1d37] text-[10px] font-bold text-white">
                  3
                </span>
                <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                  Rincian Biaya Pesanan
                </h2>
              </div>
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
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <span>Biaya Layanan & Pembayaran</span>
                    <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600 font-medium">Midtrans</span>
                  </dt>
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
