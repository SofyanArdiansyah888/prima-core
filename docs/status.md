# Status Pesanan, Pembayaran, Surat Jalan, dan SPK

Dokumen ini mendefinisikan seluruh status sistem yang tersimpan di database, label antarmuka (Dashboard & Mobile API), aturan transisi otomatis/manual, serta pemetaan backward-compatibility.

---

## 1. Pesanan (`orders.status`)

Pesanan disederhanakan menjadi **5 status utama** yang merefleksikan tahapan riil dari penerimaan pesanan hingga selesai.

| Kode Status | Label UI | Arti Operasional | Siapa / Apa yang Mengubah |
|-------------|----------|------------------|---------------------------|
| `CONFIRMED` | **Dikonfirmasi** | Pesanan baru diterima & terjadwal di plant. | Otomatis saat checkout pesanan via Mobile (`PlaceOrder`) atau dibuat via Sales Order dashboard. |
| `PROCESSING` | **Diproses** | SPK terbit & proses penimbangan / mixing batching berjalan. | **Otomatis** saat SPK diterbitkan untuk pesanan ini. |
| `ON_DELIVERY` | **Dalam Pengiriman** | Armada truk mixer / kapsul sedang dalam perjalanan membawa muatan ke lokasi proyek. | **Otomatis** saat Surat Jalan pertama kali diterbitkan untuk pesanan ini. |
| `COMPLETED` | **Selesai** | Seluruh kuantitas produk pesanan telah terkirim dan tervalidasi diterima di lokasi proyek (`fulfilled_quantity >= quantity`). | **Otomatis** saat pengantaran Surat Jalan diselesaikan (`COMPLETED`) dan total volume memenuhi 100%. (Aksi selesai manual ditiadakan untuk menjaga integritas alur fisik). |
| `CANCELLED` | **Dibatalkan** | Pesanan dibatalkan pelanggan atau staf plant sebelum armada diberangkatkan. | Pelanggan via Mobile (hanya jika masih `CONFIRMED`), atau tombol manual *"Batalkan"* di dashboard (hanya jika belum ada ritase aktif/selesai). |

### Aturan Transisi Pesanan (Runut Tanpa Lompatan):
```text
[Checkout / Buat Order]
         │
         ▼
    CONFIRMED ──────────────► CANCELLED (Batal sebelum proses/kirim)
         │
         ▼ (Otomatis saat Terbitkan SPK)
    PROCESSING
         │
         ▼ (Otomatis saat Terbitkan Surat Jalan Ritase 1..N)
    ON_DELIVERY
         │
         ▼ (Otomatis saat Pengantaran Surat Jalan Selesai & Volume 100%)
    COMPLETED
```
*(Catatan: Tombol pintas manual "Tandai Selesai" dan "Proses Pesanan" pada Sales Order telah dihilangkan agar seluruh proses operasional batching plant dan logistik armada berjalan runut dan terekam secara valid).*

### Kompatibilitas Data Lama (Backward Compatibility):
Untuk record database lama sebelum penyederhanaan status, sistem memetakan secara transparan:
- `DRAFT` dinormalisasi ke `CONFIRMED`.
- `WORK_ORDER_CREATED` dan `IN_PRODUCTION` dinormalisasi ke `PROCESSING`.
- `PARTIAL_DELIVERY` dinormalisasi ke `ON_DELIVERY`.

### Tampilan di Aplikasi Pelanggan (Mobile):
Tahapan pelacakan pada stepper detail pesanan mobile menampilkan 4 langkah berurutan:
1. **Dikonfirmasi** (Order diverifikasi & dialokasikan ke jadwal plant)
2. **Diproses** (Batching plant memproses produksi beton sesuai formula)
3. **Dalam Pengiriman** (Truk mixer dalam perjalanan mengantarkan beton ke proyek)
4. **Selesai** (Pengecoran selesai, e-POD & Surat Jalan tervalidasi)

---

## 2. Pembayaran (`orders.payment_status`)

Status pembayaran disederhanakan menjadi **3 status standar**:

| Kode Status | Label UI | Arti & Pemicu |
|-------------|----------|---------------|
| `PENDING` | **Menunggu** | Menunggu pembayaran pelanggan (Midtrans transaksi baru/pending, transfer manual belum dicek, atau VA belum dibayar). |
| `PAID` | **Lunas** | Pembayaran sukses dan terverifikasi: Webhook Midtrans `settlement` / `capture` (accept), approval kredit B2B TOP 30 Hari, atau verifikasi transfer tunai. |
| `FAILED` | **Gagal** | Transaksi tidak berhasil: Midtrans `deny`, `cancel`, `expire`, atau `refund`. |

### Integrasi Webhook Midtrans & Sinkronisasi:
- **Webhook Gateway**: `MidtransPaymentService` memetakan langsung:
  - `settlement`, `capture` (fraud status `accept`) ➔ `PAID`
  - `challenge` ➔ `PENDING`
  - `deny`, `cancel`, `expire`, `refund`, `partial_refund` ➔ `FAILED`
- **Tombol "Cek Midtrans"**: Dashboard dan Mobile menyediakan tombol sinkronisasi langsung untuk mengecek status transaksi ke API Midtrans secara real-time.
- **Kompatibilitas Lama**: Nilai lama `APPROVED_CREDIT` diperlakukan sebagai `PAID`, `CHALLENGE` sebagai `PENDING`, dan `REFUNDED` sebagai `FAILED`.

---

## 3. Surat Jalan (`surat_jalans.status`)

Status pengiriman logistik armada disederhanakan dari 7 status mikro menjadi **3 status operasional praktis**:

| Kode Status | Label UI | Arti Operasional |
|-------------|----------|------------------|
| `ON_THE_WAY` | **Dalam Perjalanan** | Surat jalan diterbitkan, armada dan muatan beton/semen langsung berangkat menuju lokasi proyek. Nilai awal saat Surat Jalan dibuat. |
| `COMPLETED` | **Selesai** | Muatan telah dibongkar, diterima oleh PIC proyek lapangan, dan e-POD tervalidasi (mencatat nama penerima & waktu penerimaan). |
| `CANCELLED` | **Dibatalkan** | Pengiriman dibatalkan / armada putar balik / retur. |

### Status Tiap Barang Pengiriman (`surat_jalan_items.status`):
- `ON_TRUCK`: Barang sedang dalam perjalanan di atas truk.
- `DELIVERED`: Barang telah diserahterimakan di lokasi tujuan proyek.
- `REJECTED`: Barang ditolak (misal slump tidak sesuai atau retur lapangan).

*Catatan Penyederhanaan*: 7 status logistik lama (`PREPARED`, `DEPARTED`, `ON_THE_WAY`, `ARRIVED`, `UNLOADING`, `COMPLETED`, `RETURNED`) dipadatkan karena pada operasional batching ready-mix, durasi pengantaran beton sangat sensitif terhadap waktu ikat semen (slump life), sehingga pencatatan mikro manual justru membebani operator lapangan.

---

## 4. SPK / Work Order (`work_orders`)

### Status Manual Ditiadakan:
- SPK **tidak lagi menggunakan siklus status manual** (tombol ubah status `SCHEDULED`, `IN_PRODUCTION`, `READY_FOR_DISPATCH`, dll. telah dihapus dari antarmuka).
- Dokumen SPK berfungsi murni sebagai **tiket resep mix design batching & target volume**.

### Pelacakan Progres Berbasis Kuantitas Riil:
Progres SPK dihitung secara otomatis dan transparan dari perbandingan kuantitas armada yang telah dikirim terhadap target volume:

$$\text{Progres Pemenuhan} = \frac{\text{dispatched\_quantity}}{\text{target\_quantity}} \times 100\%$$

Indikator pada tabel dan kartu SPK:
- **`0%` (Antrean Produksi)**: Belum ada ritase Surat Jalan yang diberangkatkan.
- **`1% – 99%` (Terkirim X%)**: Sebagian volume telah diberangkatkan oleh armada.
- **`100%` (Selesai Terpenuhi)**: Seluruh target volume telah rampung dikirim ke proyek.

### Query Pemilihan SPK pada Surat Jalan:
Pemilihan SPK saat pembuatan Surat Jalan baru tidak lagi bergantung pada status string, melainkan otomatis memfilter tiket SPK yang masih membutuhkan pengiriman:
```php
WorkOrder::query()
    ->whereRaw('dispatched_quantity < target_quantity')
    ->orderByDesc('id')
    ->get();
```
*(Catatan internal skema database: kolom `work_orders.status` tetap memiliki nilai default `'SCHEDULED'` di level database untuk menjaga integritas constraint skema).*
