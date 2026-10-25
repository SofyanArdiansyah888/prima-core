import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  businessOutline,
  callOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  copyOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../data/api';
import { Card, PrimaryButton, QuietButton, Screen, StatusBadge } from '../../shared/ui';
import { openSnapPayment } from '../../lib/midtrans';

export default function SuccessPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    uuid?: string;
    snap_token?: string;
    project_title?: string;
    customer_name?: string;
  } | null;

  const uuid = state?.uuid;
  const snapToken = state?.snap_token;
  const projectTitle = state?.project_title;
  const customerName = state?.customer_name;
  const orderCode = decodeURIComponent(code ?? '');

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  const handlePayNow = () => {
    if (snapToken) {
      void openSnapPayment(snapToken, {
        onSuccess: async () => {
          if (uuid) {
            try {
              await api.syncPayment(uuid);
            } catch {}
            navigate(`/orders/${uuid}`);
          }
        },
        onPending: async () => {
          if (uuid) {
            try {
              await api.syncPayment(uuid);
            } catch {}
            navigate(`/orders/${uuid}`);
          }
        },
        onClose: () => {
          if (uuid) navigate(`/orders/${uuid}`);
        },
      });
    } else if (uuid) {
      navigate(`/orders/${uuid}`);
    }
  };

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-4 py-8 pb-16">
        {/* BRANDING BADGE */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ea580c] shadow-2xs">
            <IonIcon icon={businessOutline} className="text-xs" />
            <span>PT Prima Karya Manunggal • Semen Tonasa Group</span>
          </div>

          {/* CHECKMARK ICON EMBLEM */}
          <div className="relative mx-auto mt-4 mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/25 border-2 border-emerald-100">
            <IonIcon icon={checkmarkCircleOutline} className="text-4xl" />
          </div>

          <h1 className="font-display text-xl font-extrabold text-[#0c1d37] tracking-tight">
            Terima Kasih atas Kepercayaan Anda
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Pesanan beton siap pakai (ready-mix) Anda telah resmi terdaftar dalam sistem.
          </p>
        </div>

        {/* FORMAL & PROFESSIONAL APPRECIATION CARD */}
        <Card className="mt-5 p-4 border border-slate-200/90 shadow-xs space-y-3 text-left">
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">
                Pemberitahuan Resmi Pemesanan
              </span>
              <p className="font-extrabold text-xs text-[#0c1d37]">
                Yth. {customerName ? customerName : 'Bapak/Ibu Pelanggan Mitra Tonasa'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200 shrink-0">
              <IonIcon icon={shieldCheckmarkOutline} className="text-xs" />
              Tercatat Resmi
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            Kami atas nama manajemen dan seluruh tim operasional <strong className="text-[#0c1d37]">PT Prima Karya Manunggal (Semen Tonasa Group)</strong> mengucapkan terima kasih yang sebesar-besarnya atas kepercayaan Bapak/Ibu telah memilih produk beton cor kami untuk menyukseskan proyek konstruksi Anda.
          </p>

          <p className="text-xs leading-relaxed text-slate-600">
            Merupakan komitmen utama kami untuk selalu menjamin mutu beton berkualitas tinggi sesuai standar SNI, konsistensi pengujian laboratorium, serta ketepatan pengantaran armada truk mixer demi kelancaran pengecoran di lokasi proyek.
          </p>
        </Card>

        {/* ORDER REGISTRATION BOX */}
        <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#0c1d37] to-[#162e55] p-4 text-white shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Nomor Registrasi Pesanan
            </span>
            <StatusBadge tone="warning">Menunggu Verifikasi Tempat</StatusBadge>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-base font-extrabold tracking-wider text-white select-all">
              {orderCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white transition-all cursor-pointer border border-white/10"
              title="Salin nomor pesanan"
            >
              <IonIcon icon={copied ? checkmarkOutline : copyOutline} className="text-xs" />
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {projectTitle && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-slate-300 text-[11px]">Nama Proyek:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{projectTitle}</span>
            </div>
          )}
        </div>

        {/* NEXT STEPS GUIDE */}
        <Card className="mt-3 p-4 border border-slate-200/80 bg-slate-50/70 text-left space-y-3">
          <h3 className="text-xs font-black text-[#0c1d37] uppercase tracking-wide flex items-center gap-1.5">
            <IonIcon icon={timeOutline} className="text-sm text-[#ea580c]" />
            <span>Tahapan Operasional Selanjutnya</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="size-5 rounded-full bg-[#0c1d37] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-bold text-[#0c1d37] text-[11px]">Verifikasi Akses & Manuver Armada</p>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Tim Sales Lapangan kami akan segera meninjau lebar jalan, radius belok, dan kelayakan akses jalan menuju titik tuang lokasi proyek Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-bold text-[#0c1d37] text-[11px]">Persetujuan (ACC) & Pembukaan Pembayaran</p>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Setelah verifikasi lokasi disetujui, tagihan resmi serta metode pembayaran online Midtrans akan otomatis aktif untuk Anda selesaikan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-bold text-[#0c1d37] text-[11px]">Produksi Batching & Pengiriman Armada</p>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Beton diproduksi dengan otomasi sistem batching plant terdekat dan dikirim tepat waktu oleh supir truk mixer kami.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CUSTOMER CARE NOTE */}
        <div className="mt-3 rounded-xl border border-blue-200/70 bg-blue-50/70 p-3 text-left flex items-start gap-2.5">
          <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <IonIcon icon={callOutline} className="text-sm" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#0c1d37] text-[11px]">Pusat Layanan Pelanggan & Bantuan Teknis</p>
            <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
              Apabila Bapak/Ibu memerlukan koordinasi khusus terkait jadwal pengecoran atau spesifikasi mutu beton, tim layanan pelanggan Tonasa senantiasa siap membantu Anda.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 w-full space-y-2.5">
          {snapToken && (
            <button
              type="button"
              onClick={handlePayNow}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-black text-white shadow-sm transition-all cursor-pointer"
            >
              <IonIcon icon={walletOutline} className="text-base" />
              <span>Buka Pembayaran Midtrans</span>
            </button>
          )}

          {uuid ? (
            <PrimaryButton type="button" onClick={() => navigate(`/orders/${uuid}`)}>
              Lihat Rincian & Status Pesanan
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => navigate('/tabs/orders')}>
              Lihat Riwayat Pesanan
            </PrimaryButton>
          )}

          <QuietButton type="button" onClick={() => navigate('/tabs/home')}>
            Kembali ke Beranda
          </QuietButton>
        </div>
      </div>
    </Screen>
  );
}
