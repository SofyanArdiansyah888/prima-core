import { useEffect, useState } from 'react';

export type GpsPosition = { lat: number; lng: number; accuracy: number };

/** Zoom peta saat memusatkan ke lokasi GPS sales / sopir. */
export const GPS_MAP_ZOOM = 21;

/** Tile OSM hanya tersedia s.d. z19; di atasnya Leaflet memperbesar tile z19. */
export const OSM_MAX_NATIVE_ZOOM = 19;

/** Selalu minta fix GPS baru (bukan cache) dengan akurasi tinggi. */
export const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

function toGps(pos: GeolocationPosition): GpsPosition {
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
}

/**
 * Ambil satu posisi GPS seakurat mungkin: pantau fix selama `timeoutMs` dan
 * kembalikan yang akurasinya terbaik, atau langsung selesai bila sudah
 * mencapai `desiredAccuracy` meter. Null bila GPS tidak tersedia / ditolak.
 */
export function getAccuratePosition(desiredAccuracy = 15, timeoutMs = 15000): Promise<GpsPosition | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    let best: GpsPosition | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve(best);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p = toGps(pos);
        if (!best || p.accuracy < best.accuracy) best = p;
        if (p.accuracy <= desiredAccuracy) finish();
      },
      (err) => {
        // Izin ditolak / GPS mati: tidak akan ada fix lagi.
        if (err.code === err.PERMISSION_DENIED || err.code === err.POSITION_UNAVAILABLE) finish();
      },
      HIGH_ACCURACY_OPTIONS,
    );

    const timer = setTimeout(finish, timeoutMs);
  });
}

/**
 * Lacak posisi GPS perangkat secara live (akurasi tinggi, tanpa cache).
 * Fix yang lebih buruk dari fix sebelumnya diabaikan selama perangkat tidak
 * berpindah jauh, agar titik tidak "melompat" ke posisi kasar dari jaringan.
 */
export function useLiveGpsPosition(enabled = true) {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setError('GPS tidak tersedia di perangkat ini.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = toGps(pos);
        setError(null);
        setPosition((prev) => {
          if (!prev) return next;
          const movedM = distanceMeters(prev.lat, prev.lng, next.lat, next.lng);
          // Terima bila lebih akurat, atau perpindahan nyata melebihi radius akurasi lama.
          if (next.accuracy <= prev.accuracy || movedM > prev.accuracy) return next;
          return prev;
        });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan GPS & izin lokasi untuk aplikasi ini.'
            : 'Gagal membaca lokasi GPS.',
        );
      },
      HIGH_ACCURACY_OPTIONS,
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rute Google Maps; titik awal = lokasi GPS perangkat bila sudah didapat. */
export function googleMapsDirUrl(destLat: number, destLng: number, origin?: GpsPosition | null): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destLat},${destLng}`,
    travelmode: 'driving',
  });
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
