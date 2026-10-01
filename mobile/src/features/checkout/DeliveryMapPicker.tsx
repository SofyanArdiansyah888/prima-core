import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IonIcon } from '@ionic/react';
import { 
  closeCircleOutline, 
  locateOutline, 
  locationOutline, 
  searchOutline 
} from 'ionicons/icons';

export type DeliveryLocation = {
  lat: number;
  lng: number;
  areaName?: string;
  roadAddress?: string;
};

interface DeliveryMapPickerProps {
  lat: number;
  lng: number;
  onChange: (loc: DeliveryLocation) => void;
}

type SearchResultItem = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    county?: string;
    state?: string;
  };
};

export function DeliveryMapPicker({ lat, lng, onChange }: DeliveryMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isMovingMap, setIsMovingMap] = useState(false);
  const [currentArea, setCurrentArea] = useState<string>('');

  // Reverse geocode lat/lng to get address
  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id-ID, id, en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const displayName = data.display_name || '';
        const road = data.address?.road || data.address?.suburb || data.address?.city_district || '';
        const city = data.address?.city || data.address?.county || data.address?.state || '';
        const shortName = [road, city].filter(Boolean).join(', ') || displayName.split(',').slice(0, 3).join(',');

        setCurrentArea(shortName);
        onChange({
          lat: latitude,
          lng: longitude,
          areaName: shortName,
          roadAddress: displayName,
        });
      }
    } catch {
      setCurrentArea(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } finally {
      setGeocoding(false);
    }
  };

  // Perform debounced address search via OpenStreetMap Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const queryWithContext = searchQuery.toLowerCase().includes('sulsel') || searchQuery.toLowerCase().includes('makassar')
          ? searchQuery
          : `${searchQuery}, Sulawesi Selatan`;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithContext)}&countrycodes=id&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'id-ID, id, en',
            },
          }
        );
        if (res.ok) {
          const data: SearchResultItem[] = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize map with move/drag listeners
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      map.on('movestart', () => {
        setIsMovingMap(true);
      });

      map.on('moveend', () => {
        setIsMovingMap(false);
        const center = map.getCenter();
        void fetchAddressFromCoords(center.lat, center.lng);
      });

      mapInstanceRef.current = map;

      // Initial address fetch if empty
      void fetchAddressFromCoords(lat, lng);
    }
  }, []);

  // Update map center when prop coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      if (Math.abs(center.lat - lat) > 0.0001 || Math.abs(center.lng - lng) > 0.0001) {
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
      }
    }
  }, [lat, lng]);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    const latitude = parseFloat(item.lat);
    const longitude = parseFloat(item.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
    }

    const displayName = item.display_name;
    const road = item.address?.road || item.address?.suburb || item.address?.city_district || '';
    const city = item.address?.city || item.address?.county || item.address?.state || '';
    const shortName = [road, city].filter(Boolean).join(', ') || displayName.split(',').slice(0, 3).join(',');

    setCurrentArea(shortName);
    setShowResults(false);
    setSearchQuery('');

    onChange({
      lat: latitude,
      lng: longitude,
      areaName: shortName,
      roadAddress: displayName,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
        }
        void fetchAddressFromCoords(latitude, longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* 1. ADDRESS SEARCH BAR */}
      <div className="relative z-30">
        <div className="relative">
          <IonIcon
            icon={searchOutline}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#ea580c]"
          />
          <input
            type="text"
            placeholder="Cari jalan, komplek, ruko, atau daerah proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0c1d37] focus:ring-2 focus:ring-[#0c1d37]/15 transition-all outline-none shadow-2xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <IonIcon icon={closeCircleOutline} className="text-base" />
            </button>
          ) : isSearching ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-spin text-[#ea580c]">
              ⏳
            </span>
          ) : null}
        </div>

        {/* Autocomplete Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-lg bg-orange-50 text-[#ea580c] shrink-0 mt-0.5">
                  <IonIcon icon={locationOutline} className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {item.display_name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                    {item.display_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. MAP INTERACTIVE CANVAS WITH FIXED CENTER PIN */}
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border-2 border-slate-200/90 shadow-inner bg-slate-100 select-none">
        {/* Map Container */}
        <div ref={mapContainerRef} className="h-full w-full z-10 cursor-grab active:cursor-grabbing" />

        {/* FIXED CENTER PIN OVERLAY (User moves map underneath) */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative flex flex-col items-center">
            {/* Tooltip hint when dragging */}
            <div
              className={`absolute -top-7 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-xs transition-opacity duration-150 ${
                isMovingMap ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Lepaskan untuk pilih lokasi
            </div>

            {/* Custom Icon Pin with Floating Animation */}
            <div
              className={`flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white shadow-xl shadow-orange-500/50 border-2 border-white ring-2 ring-[#ea580c]/30 transition-all duration-200 ease-out ${
                isMovingMap ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
              }`}
            >
              <IonIcon icon={locationOutline} className="text-xl" />
            </div>

            {/* Ground Pinpoint Pointer & Shadow */}
            <div className="flex flex-col items-center -mt-1">
              <div
                className={`size-2 rotate-45 bg-[#ea580c] transition-transform duration-200 ${
                  isMovingMap ? 'scale-75' : 'scale-100'
                }`}
              />
              <div
                className={`mt-1 h-1.5 rounded-full bg-slate-900/40 blur-[1px] transition-all duration-200 ${
                  isMovingMap ? 'w-2 opacity-30' : 'w-4 opacity-70'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Floating GPS Button */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="flex size-10 items-center justify-center rounded-xl bg-white/95 text-[#0c1d37] shadow-md border border-slate-200 backdrop-blur-xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            title="Gunakan Lokasi GPS Saya"
          >
            <IonIcon icon={locateOutline} className={`text-lg ${locating ? 'animate-spin text-[#ea580c]' : 'text-[#ea580c]'}`} />
          </button>
        </div>

        {/* Bottom Location Coordinates & Area Info */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between rounded-xl bg-white/95 px-3 py-2 text-[11px] shadow-md border border-slate-200/90 backdrop-blur-md">
          <div className="flex items-center gap-1.5 truncate">
            <IonIcon icon={locationOutline} className="text-sm text-[#ea580c] shrink-0" />
            <span className="font-bold text-[#0c1d37] truncate">
              {isMovingMap
                ? 'Menggeser peta...'
                : geocoding
                ? 'Menentukan alamat...'
                : currentArea || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-mono text-slate-400">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
