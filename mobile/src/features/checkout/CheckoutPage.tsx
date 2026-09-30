import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { PRESET_LOCATIONS } from '../../data/locations';
import { formatRupiah } from '../../domain/format';
import { PAYMENTS, type Quote } from '../../domain/types';
import { Card, ErrorText, Field, NavBar, PrimaryButton, Screen, StickyBar, TextArea, TextInput } from '../../shared/ui';

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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lines.length === 0 || lat === null || lng === null) {
      setQuote(null);
      return;
    }

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
        setError('Lokasi perangkat tidak tersedia. Pilih salah satu wilayah.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const submit = async () => {
    if (!projectTitle.trim() || !address.trim()) {
      setError('Lengkapi nama proyek dan alamat antar.');
      return;
    }

    if (lat === null || lng === null || !quote) {
      setError('Pilih lokasi antar terlebih dahulu.');
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
      header={<NavBar title="Pengiriman dan bayar" backHref="/cart" />}
      footer={(
        <StickyBar>
          <PrimaryButton type="button" disabled={submitting || lines.length === 0 || !quote} onClick={() => void submit()}>
            {submitting ? 'Mengirim…' : 'Buat pesanan sekarang'}
          </PrimaryButton>
        </StickyBar>
      )}
    >
      <form
        className="space-y-4 px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {lines.length === 0 ? <p className="text-xs text-muted">Keranjang kosong.</p> : null}
        <ErrorText>{error}</ErrorText>
        <Card className="space-y-3 p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-bold tracking-wider text-ink uppercase">Detail proyek</h2>
            <button type="button" className="inline-flex items-center gap-1 text-[11px] font-medium text-brand" onClick={useGps}>
              <IonIcon icon={locationOutline} />
              {locating ? 'Mencari…' : 'Pakai GPS'}
            </button>
          </div>
          <Field label="Nama proyek / toko">
            <TextInput required className="bg-fill" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
          </Field>
          <Field label="Alamat lengkap pengantaran">
            <TextArea required rows={2} value={address} onChange={(event) => setAddress(event.target.value)} />
          </Field>
          <div>
            <span className="mb-1.5 block text-[10px] font-medium text-muted">Wilayah operasional</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_LOCATIONS.map((place) => {
                const selected = regionId === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    className={`rounded-lg border p-2 text-left text-xs ${selected ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-fill text-muted'}`}
                    onClick={() => {
                      setRegionId(place.id);
                      setLat(place.lat);
                      setLng(place.lng);
                      setAddress(place.address);
                      if (!projectTitle) {
                        setProjectTitle(place.region);
                      }
                    }}
                  >
                    <div className="font-bold">{place.region}</div>
                    <div className="text-[10px] opacity-80">{place.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
        <Card className="space-y-2 p-3.5">
          <h2 className="font-mono text-xs font-bold tracking-wider text-ink uppercase">Metode pembayaran</h2>
          {PAYMENTS.map((method) => (
            <label key={method.value} className="flex items-center gap-2 rounded-lg border border-line p-2 text-xs">
              <input
                type="radio"
                name="payment"
                className="accent-brand"
                checked={payment === method.value}
                onChange={() => setPayment(method.value)}
              />
              <span className="font-medium text-ink">{method.label}</span>
            </label>
          ))}
          <Field label="Catatan">
            <TextInput className="bg-fill" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </Card>
        {quote ? (
          <Card className="space-y-2 p-3.5">
            <h2 className="font-mono text-xs font-bold tracking-wider text-ink uppercase">Ringkasan server</h2>
            <dl className="space-y-1.5 border-b border-line pb-2 text-xs text-muted">
              <div className="flex justify-between"><dt>Plant pengirim</dt><dd className="font-mono text-ink">{quote.plant.code}</dd></div>
              <div className="flex justify-between"><dt>Nama plant</dt><dd className="text-ink">{quote.plant.name}</dd></div>
              <div className="flex justify-between"><dt>Jarak tempuh</dt><dd className="text-ink">{quote.distance_km} km</dd></div>
              <div className="flex justify-between"><dt>Subtotal material</dt><dd className="text-ink">{formatRupiah(quote.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Ongkos kirim</dt><dd className="text-ink">{formatRupiah(quote.delivery_fee)}</dd></div>
              <div className="flex justify-between"><dt>PPN 11%</dt><dd className="text-ink">{formatRupiah(quote.ppn)}</dd></div>
            </dl>
            <div className="flex items-center justify-between pt-1 text-xs font-bold text-ink">
              <span>Total bayar</span>
              <span className="font-display text-base text-brand">{formatRupiah(quote.total_price)}</span>
            </div>
            {quote.details ? <p className="text-[11px] text-muted">{quote.details}</p> : null}
          </Card>
        ) : null}
      </form>
    </Screen>
  );
}
