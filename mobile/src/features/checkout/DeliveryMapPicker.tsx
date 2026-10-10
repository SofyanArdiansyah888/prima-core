import { useEffect, useRef, useState, useCallback } from 'react';
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
  className?: string;
  mapHeightClassName?: string;
}

export type SearchResultItem = {
  display_name: string;
  name: string;
  lat: number;
  lng: number;
  details?: string;
};

// Fast and rate-limit free OSM Geocoding using Photon by Komoot with Nominatim fallback
async function searchLocations(query: string, currentLat: number, currentLng: number): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // 1. Primary: Photon API (Free, CORS enabled, no 429 rate limit blocks)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=${currentLat}&lon=${currentLng}&limit=8`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [currentLng, currentLat];
          const name = p.name || p.street || trimmed;
          const fullParts = [
            p.name,
            p.street,
            p.housenumber ? `No. ${p.housenumber}` : '',
            p.district,
            p.city || p.county,
            p.state,
          ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

          const fullAddress = fullParts.join(', ');
          const details = [p.district, p.city || p.county, p.state]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ');

          return {
            name,
            display_name: fullAddress || name,
            details,
            lat: Number(coords[1]),
            lng: Number(coords[0]),
          };
        });
      }
    }
  } catch (err) {
    console.warn('Photon search error:', err);
  }

  // 2. Fallback: OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=id&limit=6&addressdetails=1`;
    const res = await fetch(nominatimUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          name: item.display_name?.split(',')[0] || trimmed,
          display_name: item.display_name || trimmed,
          details: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    console.warn('Nominatim search fallback error:', err);
  }

  return [];
}

async function reverseGeocode(latitude: number, longitude: number): Promise<{ shortName: string; fullName: string }> {
  // 1. Primary: Photon Reverse API
  try {
    const url = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const first = data.features?.[0];
      if (first?.properties) {
        const p = first.properties;
        const parts = [
          p.name,
          p.street,
          p.housenumber ? `No. ${p.housenumber}` : '',
          p.district,
          p.city || p.county,
          p.state,
        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

        const fullName = parts.join(', ');
        const shortName = [p.name || p.street, p.district || p.city].filter(Boolean).join(', ') || fullName;

        if (fullName) {
          return { shortName: shortName || fullName, fullName };
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Fallback: Nominatim Reverse
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      const displayName = data.display_name || '';
      const road = data.address?.road || data.address?.suburb || data.address?.city_district || '';
      const city = data.address?.city || data.address?.county || data.address?.state || '';
      const shortName = [road, city].filter(Boolean).join(', ') || displayName.split(',').slice(0, 3).join(',');
      return { shortName: shortName || displayName, fullName: displayName };
    }
  } catch {
    // ignore
  }

  const coordStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  return { shortName: coordStr, fullName: coordStr };
}

export function DeliveryMapPicker({ 
  lat, 
  lng, 
  onChange,
  className = '',
  mapHeightClassName = 'h-64',
}: DeliveryMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Stable references to prevent infinite update cycles
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  latRef.current = lat;
  lngRef.current = lng;

  const isUserDraggingRef = useRef(false);
  const lastEmittedCoordsRef = useRef<{ lat: number; lng: number }>({ lat, lng });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResultsFound, setNoResultsFound] = useState(false);

  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isMovingMap, setIsMovingMap] = useState(false);
  const [currentArea, setCurrentArea] = useState<string>('');

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse geocode lat/lng to get address
  const fetchAddressFromCoords = useCallback(async (latitude: number, longitude: number) => {
    setGeocoding(true);
    try {
      const result = await reverseGeocode(latitude, longitude);
      setCurrentArea(result.shortName);
      lastEmittedCoordsRef.current = { lat: latitude, lng: longitude };
      onChangeRef.current({
        lat: latitude,
        lng: longitude,
        areaName: result.shortName,
        roadAddress: result.fullName,
      });
    } catch {
      const coordStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setCurrentArea(coordStr);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Execute address search
  const executeSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setNoResultsFound(false);
      return;
    }

    setIsSearching(true);
    setNoResultsFound(false);
    try {
      const results = await searchLocations(query, latRef.current, lngRef.current);
      setSearchResults(results);
      setShowResults(true);
      setNoResultsFound(results.length === 0);
    } catch {
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search when user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setNoResultsFound(false);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void executeSearch(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  // Initialize map with move/drag listeners ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = latRef.current;
    const initialLng = lngRef.current;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('movestart', () => {
      isUserDraggingRef.current = true;
      setIsMovingMap(true);
    });

    map.on('moveend', () => {
      setIsMovingMap(false);
      const center = map.getCenter();
      lastEmittedCoordsRef.current = { lat: center.lat, lng: center.lng };
      void fetchAddressFromCoords(center.lat, center.lng);
      setTimeout(() => {
        isUserDraggingRef.current = false;
      }, 50);
    });

    mapInstanceRef.current = map;

    // Invalidate size after render to avoid tile cutoff
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Initial address fetch only once on mount
    void fetchAddressFromCoords(initialLat, initialLng);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [fetchAddressFromCoords]);

  // Update map center ONLY when prop coordinates change externally (e.g. search / GPS)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isUserDraggingRef.current) return;

    // Do nothing if the prop coordinates match what was just emitted by the map
    const last = lastEmittedCoordsRef.current;
    if (Math.abs(last.lat - lat) < 0.0001 && Math.abs(last.lng - lng) < 0.0001) {
      return;
    }

    const center = mapInstanceRef.current.getCenter();
    if (Math.abs(center.lat - lat) > 0.0001 || Math.abs(center.lng - lng) > 0.0001) {
      lastEmittedCoordsRef.current = { lat, lng };
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: false });
    }
  }, [lat, lng]);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    lastEmittedCoordsRef.current = { lat: item.lat, lng: item.lng };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lng], 16, { animate: true });
    }

    setCurrentArea(item.name);
    setShowResults(false);
    setSearchQuery(item.name);

    onChangeRef.current({
      lat: item.lat,
      lng: item.lng,
      areaName: item.name,
      roadAddress: item.display_name,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        lastEmittedCoordsRef.current = { lat: latitude, lng: longitude };

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
    <div className={`space-y-3 ${className}`}>
      {/* 1. ADDRESS SEARCH BAR & AUTOCOMPLETE */}
      <div ref={searchContainerRef} className="relative z-30">
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void executeSearch(searchQuery);
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-20 text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0c1d37] focus:ring-2 focus:ring-[#0c1d37]/15 transition-all outline-none shadow-2xs"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <span className="text-xs animate-spin text-[#ea580c] px-1">⏳</span>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                  setNoResultsFound(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <IonIcon icon={closeCircleOutline} className="text-base" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void executeSearch(searchQuery)}
              className="flex size-7 items-center justify-center rounded-lg bg-[#0c1d37] hover:bg-slate-800 text-white shadow-2xs transition-all cursor-pointer"
              title="Cari Alamat"
            >
              <IonIcon icon={searchOutline} className="text-xs" />
            </button>
          </div>
        </div>

        {/* Autocomplete Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            {searchResults.length > 0 ? (
              searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-3 hover:bg-orange-50/60 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="flex size-7 items-center justify-center rounded-lg bg-orange-100 text-[#ea580c] shrink-0 mt-0.5">
                    <IonIcon icon={locationOutline} className="text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                      {item.display_name}
                    </p>
                  </div>
                </button>
              ))
            ) : noResultsFound ? (
              <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Lokasi tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Coba ketik kata kunci yang lebih spesifik atau geser pin langsung pada peta.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 2. MAP INTERACTIVE CANVAS WITH FIXED CENTER PIN */}
      <div className={`relative ${mapHeightClassName} w-full overflow-hidden rounded-2xl border-2 border-slate-200/90 shadow-inner bg-slate-100 select-none`}>
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
