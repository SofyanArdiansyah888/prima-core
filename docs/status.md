# Status pesanan, pembayaran, dan dokumen

Kode disimpan di database. Label di bawah adalah teks yang dipakai API pelanggan (`CustomerOrderController`).

## Pesanan (`orders.status`)

Pesanan dari aplikasi mobile langsung dibuat sebagai `CONFIRMED`.

| Kode | Label |
|------|--------|
| `DRAFT` | Draf |
| `CONFIRMED` | Dikonfirmasi |
| `WORK_ORDER_CREATED` | SPK Terbit |
| `IN_PRODUCTION` | Dalam Produksi |
| `PARTIAL_DELIVERY` | Sebagian Terkirim |
| `COMPLETED` | Selesai |
| `CANCELLED` | Dibatalkan |

Langkah di detail pesanan mobile: Dikonfirmasi → SPK terbit → Produksi → Sebagian terkirim → Selesai. Draf dan Dibatalkan tidak masuk langkah itu. Pesanan hanya bisa dibatalkan pelanggan selama status masih `CONFIRMED`.

## Pembayaran (`orders.payment_status`)

Pesanan mobile mulai dari `PENDING`. Sync ke Midtrans hanya jalan selama metode `MIDTRANS` dan status masih `PENDING`.

| Kode | Arti |
|------|------|
| `PENDING` | Menunggu bayar. Label di mobile: **Menunggu**. |
| `PAID` | Lunas. Midtrans `settlement`, atau `capture` dengan `fraud_status` `accept`. |
| `APPROVED_CREDIT` | Kredit disetujui. Ada di data dashboard lama, bukan alur pemesanan mobile. |
| `CHALLENGE` | Kartu ditahan Midtrans (`capture` + `fraud_status` `challenge`). |
| `FAILED` | Midtrans `deny`, `cancel`, atau `expire`. |
| `REFUNDED` | Midtrans `refund` atau `partial_refund`. |

Form dashboard hanya menerima `PENDING`, `PAID`, dan `APPROVED_CREDIT`. Tiga kode terakhir diisi oleh layanan Midtrans.

Di kartu rincian mobile, hanya `PENDING` yang diterjemahkan. Kode lain masih tampil mentah (contoh: `PAID`).

Metode yang dikenali API: `MIDTRANS` (label **Midtrans**), `VA_MANDIRI`, `VA_BRI`, `CASH`, `TRANSFER`.

## Surat jalan (`surat_jalans.status`)

Dipakai di modul Distribusi dashboard. Halaman dokumen mobile belum membaca status ini. Layar itu menampilkan semua pesanan pelanggan dan badge **Dokumen Sah**, tanpa membedakan apakah surat jalan sudah terbit.

| Kode | Arti operasional |
|------|------------------|
| `PREPARED` | Disiapkan. Nilai awal. |
| `DEPARTED` | Berangkat dari plant. |
| `ON_THE_WAY` | Dalam perjalanan. |
| `ARRIVED` | Tiba di lokasi. |
| `UNLOADING` | Bongkar muatan. |
| `COMPLETED` | Selesai. |
| `RETURNED` | Kembali. |

Status tiap barang surat jalan (`surat_jalan_items.status`): `ON_TRUCK`, `DELIVERED`, `REJECTED`.

## SPK (`work_orders.status`)

| Kode |
|------|
| `SCHEDULED` |
| `IN_PRODUCTION` |
| `READY_FOR_DISPATCH` |
| `COMPLETED` |
| `CANCELLED` |
