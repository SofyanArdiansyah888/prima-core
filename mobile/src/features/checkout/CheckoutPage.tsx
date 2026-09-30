import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  locationOutline, 
  navigateOutline, 
  cardOutline, 
  cashOutline, 
  businessOutline, 
  checkmarkCircle, 
  documentTextOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { PRESET_LOCATIONS } from '../../data/locations';
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, clear } = useCart();
  const [projectTitle, setProjectTitle] = useState('');
  const [address, setAddress] = useState('');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [payment, setPayment] = useState<string>('CASH');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    }, 300);

    return () => window.clearTimeout(timer);
  }, [lines, lat, lng]);

  const useGps = () => {
    setLocating(true);
    setRegionId(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('Lokasi GPS tidak dapat diakses. Silakan pilih salah satu wilayah di bawah.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const submit = async () => {
    if (!projectTitle.trim() || !address.trim()) {
      setError('Harap lengkapi nama proyek dan alamat tujuan pengantaran.');
      return;
    }

    if (lat === null || lng === null || !quote) {
      setError('Silakan pilih salah satu wilayah operasional pengantaran.');
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
      clear();
      navigate(`/success/${encodeURIComponent(response.data.code)}`, {
        state: { uuid: response.data.uuid },
      });
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
                  {quote ? formatRupiah(quote.total_price) : calculating ? 'Menghitung...' : 'Pilih Wilayah'}
                </span>
              </div>
              {quote && (
                <span className="text-right text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  {quote.distance_km} km dari Plant
                </span>
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
        className="space-y-3.5 px-4 py-4 pb-28"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <ErrorText>{error}</ErrorText>

        {/* STEP 1: PROYEK & ALAMAT */}
        <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#0c1d37] text-[10px] font-bold text-white">
                1
              </span>
              <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                Lokasi & Proyek
              </h2>
            </div>

            <button 
              type="button" 
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-[#0c1d37] hover:bg-slate-200 transition-colors cursor-pointer" 
              onClick={useGps}
            >
              <IonIcon icon={navigateOutline} className="text-xs text-[#d91424]" />
              <span>{locating ? 'Mencari…' : 'Gunakan GPS'}</span>
            </button>
          </div>

          <Field label="Nama Proyek / Toko Pemesan" hint="Wajib diisi">
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

          <div>
            <span className="mb-2 block text-xs font-bold text-[#0c1d37]">
              Pilih Wilayah Operasional Terdekat:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map((place) => {
                const selected = regionId === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      selected 
                        ? 'border-[#0c1d37] bg-[#0c1d37] text-white shadow-xs' 
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setRegionId(place.id);
                      setLat(place.lat);
                      setLng(place.lng);
                      setAddress(place.address);
                      if (!projectTitle) {
                        setProjectTitle(`Proyek ${place.region}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">{place.region}</span>
                      {selected && <IonIcon icon={checkmarkCircle} className="text-sm text-emerald-400" />}
                    </div>
                    <div className={`text-[10px] mt-0.5 truncate ${selected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {place.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* STEP 2: METODE PEMBAYARAN */}
        <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#0c1d37] text-[10px] font-bold text-white">
              2
            </span>
            <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
              Metode Pembayaran
            </h2>
          </div>

          <div className="space-y-2">
            {PAYMENTS.map((method) => {
              const selected = payment === method.value;
              return (
                <label 
                  key={method.value} 
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                    selected 
                      ? 'border-[#0c1d37] bg-slate-50 font-bold text-[#0c1d37] shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IonIcon 
                      icon={method.value === 'CASH' ? cashOutline : cardOutline} 
                      className={`text-base ${selected ? 'text-[#0c1d37]' : 'text-slate-400'}`} 
                    />
                    <span>{method.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    className="accent-[#0c1d37] size-4 cursor-pointer"
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

        {/* STEP 3: RINGKASAN BIAYA SERVER (QUOTE) */}
        {quote ? (
          <Card className="space-y-3 p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                  ✓
                </span>
                <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                  Ringkasan Kalkulasi Server
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">{quote.plant.code}</span>
            </div>

            <dl className="space-y-1.5 border-b border-slate-100 pb-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Plant Produksi Tonasa</dt>
                <dd className="font-bold text-slate-800">{quote.plant.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Jarak Tempuh Armada</dt>
                <dd className="font-mono font-semibold text-slate-800">{quote.distance_km} km</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal Material</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ongkos Kirim Armada</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">PPN (11%)</dt>
                <dd className="font-semibold text-slate-800">{formatRupiah(quote.ppn)}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">Total Pembayaran</span>
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
        ) : calculating ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
            Sedang menghitung jarak dan tarif pengiriman otomatis...
          </div>
        ) : null}
      </form>
    </Screen>
  );
}
