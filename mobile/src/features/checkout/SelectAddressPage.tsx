import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { 
  checkmarkCircle, 
  locationOutline, 
  businessOutline, 
  informationCircleOutline 
} from 'ionicons/icons';
import { useAuth } from '../../data/auth';
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

export interface SavedDeliveryAddress {
  projectTitle: string;
  address: string;
  lat: number;
  lng: number;
}

export const DELIVERY_ADDRESS_KEY = 'pkm_delivery_address';

export function getSavedDeliveryAddress(): SavedDeliveryAddress | null {
  try {
    const raw = localStorage.getItem(DELIVERY_ADDRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedDeliveryAddress;
  } catch {
    return null;
  }
}

export function saveDeliveryAddress(data: SavedDeliveryAddress): void {
  localStorage.setItem(DELIVERY_ADDRESS_KEY, JSON.stringify(data));
}

export default function SelectAddressPage() {
  const navigate = useNavigate();
  const { customer } = useAuth();

  const saved = getSavedDeliveryAddress();

  const [projectTitle, setProjectTitle] = useState(
    saved?.projectTitle || (customer?.name ? `Proyek ${customer.name}` : '')
  );
  const [address, setAddress] = useState(saved?.address || '');
  const [lat, setLat] = useState<number>(saved?.lat ?? -5.1477);
  const [lng, setLng] = useState<number>(saved?.lng ?? 119.4327);
  const [error, setError] = useState('');

  const handleLocationChange = useCallback((loc: DeliveryLocation) => {
    setLat(loc.lat);
    setLng(loc.lng);
    if (loc.roadAddress) {
      setAddress(loc.roadAddress);
    } else if (loc.areaName) {
      setAddress(loc.areaName);
    }
  }, []);

  const handleSaveAndConfirm = () => {
    if (!projectTitle.trim()) {
      setError('Harap isi nama proyek atau nama toko pemesan.');
      return;
    }
    if (!address.trim()) {
      setError('Harap lengkapi alamat lengkap pengantaran dan patokan lokasi.');
      return;
    }

    const payload: SavedDeliveryAddress = {
      projectTitle: projectTitle.trim(),
      address: address.trim(),
      lat,
      lng,
    };

    saveDeliveryAddress(payload);
    navigate('/checkout', { state: { addressUpdated: true } });
  };

  return (
    <Screen
      header={<NavBar title="Pilih Alamat Pengiriman" backHref="/checkout" />}
      footer={
        <StickyBar>
          <PrimaryButton 
            type="button" 
            onClick={handleSaveAndConfirm}
          >
            <IonIcon icon={checkmarkCircle} className="text-base" />
            <span>Gunakan Alamat Ini</span>
          </PrimaryButton>
        </StickyBar>
      }
    >
      <div className="space-y-4 px-4 py-4 pb-28">
        <ErrorText>{error}</ErrorText>

        {/* Petunjuk / Informasi */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
          <IonIcon icon={informationCircleOutline} className="text-base text-[#ea580c] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">Geser Peta atau Cari Lokasi</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Titik pin di tengah peta menentukan batching plant terdekat dan kalkulasi ongkir armada.
            </p>
          </div>
        </div>

        {/* Interactive Leaflet Map Canvas */}
        <Card className="p-3.5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <IonIcon icon={locationOutline} className="text-base text-[#ea580c]" />
              <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                Titik Peta Pengantaran
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>

          <DeliveryMapPicker 
            lat={lat} 
            lng={lng} 
            onChange={handleLocationChange} 
            mapHeightClassName="h-72 sm:h-80"
          />
        </Card>

        {/* Input Details */}
        <Card className="p-4 border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <IonIcon icon={businessOutline} className="text-base text-[#0c1d37]" />
            <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
              Detail Alamat & Identitas Proyek
            </h2>
          </div>

          <Field label="Nama Proyek / Toko Pemesan">
            <TextInput 
              required 
              placeholder="Contoh: Ruko Panakkukang / Toko Berkah"
              value={projectTitle} 
              onChange={(e) => setProjectTitle(e.target.value)} 
            />
          </Field>

          <Field label="Alamat Lengkap Pengantaran & Patokan">
            <TextArea 
              required 
              rows={3} 
              placeholder="Sertakan nama jalan, nomor, atau patokan jelas (Contoh: Jl. Poros Tonasa II, RT 01 / RW 02, Depan Masjid Raya...)"
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </Field>
        </Card>
      </div>
    </Screen>
  );
}
