# Status Pesanan, Pembayaran, Surat Jalan, dan SPK

Dokumen ini mendefinisikan seluruh status sistem yang tersimpan di database, label antarmuka (Dashboard & Mobile API), aturan transisi otomatis/manual, serta pemetaan backward-compatibility.

---

## 1. Pesanan (`orders.status`)

Pesanan disederhanakan menjadi **6 status utama** yang merefleksikan tahapan riil dari pemesanan, verifikasi lapangan, produksi, hingga konfirmasi penerimaan.

| Kode Status | Label UI | Arti Operasional | Siapa / Apa yang Mengubah |
|-------------|----------|------------------|---------------------------|
| `PENDING_APPROVAL` | **Menunggu Verifikasi** | Pesanan baru masuk via Mobile B2C; menunggu pengecekan akses jalan armada truk besar oleh tim sales. | Otomatis saat checkout pesanan via Mobile (`PlaceOrder`). |
| `CONFIRMED` | **Dikonfirmasi** | Pesanan disetujui (ACC) oleh Sales; titik bongkar tervalidasi dan pembayaran Midtrans aktif. | Petugas **Sales via Mobile** setelah survei akses armada & input catatan survei (`survey_notes`). |
| `PROCESSING` | **Diproses** | SPK terbit & proses penimbangan / mixing batching berjalan di plant. | **Otomatis** saat SPK diterbitkan untuk pesanan ini. SPK & Surat Jalan **hanya bisa terbit bila pesanan sudah lunas** (`PAID`). |
| `ON_DELIVERY` | **Dalam Pengiriman** | Armada truk mixer / kapsul sedang dalam perjalanan membawa muatan ke lokasi proyek. | **Otomatis** saat Surat Jalan pertama kali diterbitkan untuk pesanan ini. |
| `COMPLETED` | **Selesai** | Seluruh kuantitas produk pesanan telah terkirim dan telah dikonfirmasi tuntas. | **Dikonfirmasi oleh Pelanggan (User)** di Mobile setelah semua Surat Jalan tiba, atau **Otomatis Selesai (Auto-Finish)** oleh sistem jika tidak dikonfirmasi dalam waktu **2 x 24 jam (48 jam)**. *(Supir hanya menyelesaikan Surat Jalan fisik e-POD, tidak otomatis menyelesaikan pesanan).* |
| `CANCELLED` | **Dibatalkan** | Pesanan ditolak sales karena akses tidak memadai, atau dibatalkan sebelum diproses. | Ditolak oleh Sales via Mobile (`rejection_reason`), atau **dibatalkan Admin** di dashboard (`cancellation_reason`) selama belum ada ritase SJ. Pelanggan **tidak bisa** membatalkan sendiri. Bila sudah lunas, admin wajib mencatat refund (`payment_status = REFUNDED`). |

### Aturan Transisi Pesanan:
```text
[Checkout Order di Mobile]
         │
         ▼
  PENDING_APPROVAL ─────────────► CANCELLED (Ditolak Sales / Akses Tidak Layak)
         │
         ▼ (Disetujui / ACC oleh Sales Lapangan via Mobile)
     CONFIRMED ─────────────────► CANCELLED (Batal sebelum proses produksi)
         │
         ▼ (Otomatis saat Terbitkan SPK di Batching Plant)
    PROCESSING
         │
         ▼ (Otomatis saat Terbitkan Surat Jalan Ritase 1..N)
    ON_DELIVERY
         │
         ├─► Supir menyelesaikan Surat Jalan (e-POD) ➔ SJ COMPLETED
         │   (Status Order tetap ON_DELIVERY)
         │
         ▼
    COMPLETED
         ├── Jalur Utama: Pelanggan klik "Konfirmasi Pesanan Selesai" di Mobile
         └── Jalur Otomatis: Auto-finish sistem jika 2 x 24 jam tidak dikonfirmasi pelanggan
```
*(Catatan: Tombol pintas manual "Tandai Selesai" dan "Proses Pesanan" pada Sales Order di dashboard telah dihilangkan agar seluruh proses operasional batching plant dan logistik armada berjalan runut dan terekam secara valid).*

### Kompatibilitas Data Lama (Backward Compatibility):
Untuk record database lama sebelum penyederhanaan status, sistem memetakan secara transparan:
- `DRAFT` dinormalisasi ke `CONFIRMED`.
- `WORK_ORDER_CREATED` dan `IN_PRODUCTION` dinormalisasi ke `PROCESSING`.
- `PARTIAL_DELIVERY` dinormalisasi ke `ON_DELIVERY`.

### Tampilan di Aplikasi Pelanggan (Mobile):
Tahapan pelacakan pada stepper detail pesanan mobile menampilkan 5 langkah berurutan:
1. **Menunggu Verifikasi** (Sales lapangan mengecek kelayakan akses jalan proyek untuk truk mixer)
2. **Dikonfirmasi** (Order di-ACC sales, siap dibayar via Midtrans & dialokasikan ke jadwal plant)
3. **Diproses** (Batching plant memproses produksi beton sesuai formula & SPK)
4. **Dalam Pengiriman** (Truk mixer dalam perjalanan mengantarkan beton ke proyek)
5. **Selesai** (Pengecoran selesai, seluruh muatan diterima, dan dikonfirmasi pelanggan / auto-finish)

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
- **`REFUNDED`**: dicatat admin saat membatalkan pesanan lunas (nominal, referensi transfer, waktu, petugas). Dana dikembalikan manual (transfer / dashboard Midtrans); sinkron Midtrans tidak menimpa status ini.
- **Kompatibilitas Lama**: Nilai lama `APPROVED_CREDIT` diperlakukan sebagai `PAID`, dan `CHALLENGE` sebagai `PENDING`.

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

### Aturan Transisi Surat Jalan:
- `COMPLETED` dan `CANCELLED` bersifat final: tidak bisa diubah lagi dari dashboard, dan supir tidak bisa menyelesaikan SJ yang sudah dibatalkan.
- SJ ditugaskan ke supir lewat pilihan **Supir Terdaftar** di form SJ (`driver_id`). Fallback lama: pencocokan `driver_phone` persis sama dengan nomor HP akun supir.
- `orders.delivered_at` diisi saat seluruh kuantitas terkirim **dan** tidak ada ritase aktif; dikosongkan lagi bila sebuah ritase dibatalkan. Pelanggan baru bisa "Konfirmasi Selesai" setelah tidak ada ritase aktif.

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
