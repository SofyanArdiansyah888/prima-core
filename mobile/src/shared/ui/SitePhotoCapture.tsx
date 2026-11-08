import { useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cameraOutline, checkmarkCircle, locationOutline, warningOutline } from 'ionicons/icons';
import type { SitePhoto } from '../../domain/types';
import type { SitePhotoUpload } from '../../data/staffApi';

type Props = {
  /** Judul kecil di atas tombol, mis. "Foto Survei Lokasi" */
  title: string;
  /** Label peran yang dicap pada foto, mis. "SALES" / "SOPIR" */
  stampLabel: string;
  /** Teks referensi pada cap foto, mis. kode pesanan / surat jalan */
  reference: string;
  photos: SitePhoto[];
  upload: (input: SitePhotoUpload) => Promise<SitePhoto>;
  onUploaded?: (photo: SitePhoto) => void;
  compact?: boolean;
  /** Hanya tampilkan galeri (tanpa tombol ambil foto) */
  readOnly?: boolean;
};

type Position = { lat: number; lng: number; accuracy: number } | null;

function getPosition(): Promise<Position> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto tidak dapat dibaca.'));
    };
    img.src = url;
  });
}

/** Perkecil foto (maks 1600px) dan beri cap waktu + koordinat sebagai bukti kehadiran. */
async function stampAndCompress(file: File, lines: string[]): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, w, h);

  const fontSize = Math.max(14, Math.round(w / 45));
  const pad = Math.round(fontSize * 0.6);
  const boxH = lines.length * (fontSize + 4) + pad * 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, h - boxH, w, boxH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, pad, h - boxH + pad + i * (fontSize + 4)));

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.82));
}

function distanceBadge(photo: SitePhoto) {
  if (photo.distance_m == null) {
    return <span className="rounded bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold text-white">Tanpa GPS</span>;
  }
  const label = photo.distance_m >= 1000 ? `${(photo.distance_m / 1000).toFixed(1)} km` : `${photo.distance_m} m`;
  return photo.on_site ? (
    <span className="rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">Di lokasi · {label}</span>
  ) : (
    <span className="rounded bg-amber-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">{label} dari lokasi</span>
  );
}

export function SitePhotoCapture({ title, stampLabel, reference, photos, upload, onUploaded, compact, readOnly }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'' | 'gps' | 'upload'>('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<SitePhoto | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      setBusy('gps');
      const pos = await getPosition();
      setBusy('upload');
      const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      const lines = [
        `PT PRIMA KARYA MANUNGGAL · ${stampLabel}`,
        `${reference} · ${now}`,
        pos ? `GPS ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)} (±${Math.round(pos.accuracy)} m)` : 'GPS tidak tersedia',
      ];
      const blob = await stampAndCompress(file, lines);
      const photo = await upload({ photo: blob, lat: pos?.lat, lng: pos?.lng, accuracy: pos?.accuracy });
      onUploaded?.(photo);
      if (!pos) setError('Foto tersimpan tanpa lokasi GPS. Aktifkan izin lokasi agar jarak ke proyek tercatat.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengunggah foto.');
    } finally {
      setBusy('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {!compact && (
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0c1d37]">
          <IonIcon icon={cameraOutline} className="text-sm text-slate-500" />
          {title}
        </p>
      )}

      {!readOnly && (<>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy !== ''}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#0c1d37]/30 bg-[#0c1d37] hover:bg-slate-800 py-2.5 px-3 text-xs font-bold text-white shadow-2xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
      >
        <IonIcon icon={busy ? locationOutline : cameraOutline} className="text-base" />
        <span>
          {busy === 'gps' ? 'Mengambil lokasi GPS…' : busy === 'upload' ? 'Mengunggah foto…' : 'Ambil Foto di Lokasi'}
        </span>
      </button>
      </>)}

      {error ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
          <IonIcon icon={warningOutline} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.uuid}
              type="button"
              onClick={() => setPreview(photo)}
              className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 cursor-pointer"
            >
              <img src={photo.url} alt="Foto lokasi" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute bottom-1 left-1">{distanceBadge(photo)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">Belum ada foto lokasi.</p>
      )}

      {preview ? (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/85 p-4" onClick={() => setPreview(null)}>
          <img src={preview.url} alt="Foto lokasi" className="max-h-[75vh] max-w-full rounded-lg object-contain" />
          <div className="mt-3 space-y-1 text-center text-[11px] text-white/90">
            <div className="flex justify-center">{distanceBadge(preview)}</div>
            <p>
              {preview.taken_by ? `${preview.taken_by} · ` : ''}
              {preview.taken_at ? new Date(preview.taken_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            </p>
            {preview.lat != null && preview.lng != null ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${preview.lat},${preview.lng}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-bold text-sky-300"
              >
                <IonIcon icon={checkmarkCircle} /> Lihat titik foto di Google Maps
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
