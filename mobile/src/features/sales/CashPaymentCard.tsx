import { useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cameraOutline, cashOutline, checkmarkCircleOutline, timeOutline, warningOutline } from 'ionicons/icons';
import { staffApi } from '../../data/staffApi';
import { formatRupiah } from '../../domain/format';
import type { SalesOrderSummary } from '../../domain/types';
import { Card } from '../../shared/ui';

const PAYMENT_LABEL: Record<string, string> = {
  PENDING: 'Belum Lunas',
  PAID: 'Lunas',
  FAILED: 'Gagal',
  REFUNDED: 'Dikembalikan',
  APPROVED_CREDIT: 'Lunas',
};

/** Perkecil foto kuitansi (maks 1600px, JPEG) agar unggahan ringan di jaringan lapangan. */
async function compressPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto.'))), 'image/jpeg', 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Sales mencatat pembayaran tunai yang diterima di lapangan (nominal + foto kuitansi).
 * Pesanan baru LUNAS setelah admin / keuangan memverifikasi di dashboard.
 */
export function CashPaymentCard({ order, onUpdated }: { order: SalesOrderSummary; onUpdated: (order: SalesOrderSummary) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (order.status === 'PENDING_APPROVAL' || order.status === 'CANCELLED') return null;

  const cash = order.cash_payment ?? null;
  const isPaid = order.payment_status === 'PAID' || order.payment_status === 'APPROVED_CREDIT';
  const cashPending = cash?.status === 'PENDING_VERIFICATION';
  const canRecord = !isPaid && !cashPending && order.payment_status !== 'REFUNDED';

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const blob = await compressPhoto(file);
      setPhoto(blob);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses foto.');
    }
  };

  const submit = async () => {
    if (!photo) {
      setError('Ambil foto kuitansi / bukti terima uang terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await staffApi.recordCashPayment(order.uuid, { amount: order.total_price, photo, notes: notes.trim() || undefined });
      setMessage(res.message);
      setOpen(false);
      setPhoto(null);
      setPreview(null);
      setNotes('');
      onUpdated(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mencatat pembayaran.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3.5 border border-slate-200 bg-white space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={cashOutline} className="text-base text-[#0c1d37]" />
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#0c1d37]">Pembayaran</h3>
        </div>
        <span
          className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${
            isPaid ? 'bg-emerald-100 text-emerald-800' : cashPending ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {cashPending ? 'Tunai · Verifikasi' : PAYMENT_LABEL[order.payment_status ?? ''] ?? order.payment_status}
        </span>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Total Tagihan</span>
        <span className="font-mono font-black text-[#0c1d37]">{formatRupiah(order.total_price)}</span>
      </div>

      {message && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2 text-[11px] font-semibold text-emerald-800">
          <IonIcon icon={checkmarkCircleOutline} /> {message}
        </p>
      )}

      {cash && (
        <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-0.5">
          <p className="flex items-center gap-1 font-bold text-slate-800">
            <IonIcon icon={cash.status === 'REJECTED' ? warningOutline : cash.status === 'VERIFIED' ? checkmarkCircleOutline : timeOutline} />
            {cash.status === 'VERIFIED'
              ? `Tunai ${formatRupiah(cash.amount)} terverifikasi oleh ${cash.verified_by ?? '-'}`
              : cash.status === 'REJECTED'
                ? 'Catatan tunai ditolak'
                : `Tunai ${formatRupiah(cash.amount)} menunggu verifikasi admin / keuangan`}
          </p>
          {cash.status === 'REJECTED' && cash.rejection_reason && <p>Alasan: {cash.rejection_reason}</p>}
          {cash.recorded_at && <p>Dicatat {new Date(cash.recorded_at).toLocaleString('id-ID')} oleh {cash.recorded_by ?? '-'}</p>}
        </div>
      )}

      {canRecord && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-[#0c1d37] bg-white py-2.5 text-xs font-black text-[#0c1d37] active:scale-[0.98]"
        >
          Catat Pembayaran Tunai
        </button>
      )}

      {canRecord && open && (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] text-slate-600">
            Pastikan uang tunai yang diterima sebesar <strong>{formatRupiah(order.total_price)}</strong>. Foto kuitansi bertanda tangan customer.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
          {preview ? (
            <button type="button" onClick={() => fileRef.current?.click()} className="block w-full">
              <img src={preview} alt="Foto kuitansi" className="h-36 w-full rounded-lg object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 py-5 text-xs font-bold text-slate-600"
            >
              <IonIcon icon={cameraOutline} className="text-base" /> Foto Kuitansi / Bukti Terima
            </button>
          )}
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan (opsional), mis. diterima oleh mandor proyek"
            className="w-full rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-[#0c1d37]"
          />
          {error && <p className="text-[11px] font-semibold text-[#d91424]">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-bold text-slate-700">
              Batal
            </button>
            <button
              type="button"
              disabled={busy || !photo}
              onClick={() => void submit()}
              className="flex-1 rounded-lg bg-[#0c1d37] py-2 text-xs font-black text-white disabled:opacity-60"
            >
              {busy ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
