# Modules map

## Shared

- Path: `dashboard/Modules/Shared`
- Key: `app/Concerns/HasUuid.php`, `app/Services/CodeGenerator.php`, `app/Http/Middleware/EnsureUserIsAdmin.php`, `app/Enums/*`
- Migration: `document_sequences`
- Routes: none (public)

## Branch

- Routes: `/master/branches` (resource, uuid binding)
- Controller: `Modules\Branch\Http\Controllers\BranchController`
- Model: `Modules\Branch\Models\Branch`
- Pages: `resources/js/pages/modules/branch/{index,form}.tsx`

## BatchingPlant

- Routes: `/master/batching-plants`
- Controller: `Modules\BatchingPlant\Http\Controllers\BatchingPlantController`
- Model: `Modules\BatchingPlant\Models\BatchingPlant` (`branch_id` FK, `phone`, `whatsapp` untuk kartu dispatcher di detail pesanan mobile)
- Pages: `resources/js/pages/modules/batching-plant/{index,form}.tsx`

## User

- Routes: `/master/users`
- Controller: `Modules\User\Http\Controllers\UserController`
- Model auth: `App\Models\User` (Fortify)
- Pages: `resources/js/pages/modules/user/{index,form}.tsx`
- Sync: `batching_plant_ids[]` → pivot `batching_plant_user`
- `has_full_plant_access` → akses transaksi semua batching plant (admin selalu penuh); lihat `docs/domain.md` → Pemisahan data per batching plant (test: `tests/Feature/PlantAccessTest.php`)
- Login dashboard ditolak untuk sales & supir (`AppServiceProvider` + middleware `EnsureDashboardRole`)
- API login staf mobile (sales & supir): `/api/staff/v1/{login,me,logout}` → `StaffAuthApiController` (test: `tests/Feature/StaffMobileLoginTest.php`)

## Customer

- Path: `dashboard/Modules/Customer`
- Model: `Modules\Customer\Models\Customer` (terpisah dari user staf)
- API: `/api/customer/v1` — daftar dan lupa sandi lewat OTP WhatsApp (Fonnte), masuk, profil, katalog, quote ongkir, buat/lacak/batal pesanan B2C
- Dashboard: `/sales/customers` (`CustomerController`, halaman `resources/js/pages/modules/customer/{index,show}.tsx`) — daftar, detail + riwayat pesanan, aktif/nonaktif akun (`PATCH /sales/customers/{uuid}/toggle-active`, admin/akses semua plant; menonaktifkan juga mencabut token mobile)
- App: [`mobile/`](../mobile/) Ionic React + Tailwind
- Seed lokal: `081300000001` / `password`

## Banner

- Routes: `/master/banners`, `GET /api/customer/v1/banners`
- Controller: `Modules\Banner\Http\Controllers\BannerController`
- Model: `Modules\Banner\Models\Banner`
- Pages: `resources/js/pages/modules/banner/{index,form}.tsx`
- Fitur: Master isi slider beranda aplikasi pelanggan.

## ProductCategory

- Routes: `/master/product-categories`
- Controller: `Modules\ProductCategory\Http\Controllers\ProductCategoryController`
- Model: `Modules\ProductCategory\Models\ProductCategory`
- Pages: `resources/js/pages/modules/product-category/{index,form}.tsx`
- Fitur: Master kategori produk. Slug dipakai `products.category`. Satuan dan kapasitas default mengikuti kategori saat produk dibuat.

## Product

- Routes: `/master/products`
- Controller: `Modules\Product\Http\Controllers\ProductController`
- Model: `Modules\Product\Models\Product`
- Pages: `resources/js/pages/modules/product/{index,form}.tsx`
- Fitur: Manajemen katalog ready mix & semen, setting kapasitas batas armada (`max_trip_capacity`), dan aturan penggabungan muatan (`allow_combined_delivery`).

## DeliveryRate

- Routes: `/master/delivery-rates`, `POST /api/delivery-rates/calculate-nearest`
- Controller: `Modules\DeliveryRate\Http\Controllers\DeliveryRateController`
- Model: `Modules\DeliveryRate\Models\PlantDeliveryRate`
- Service: `Modules\DeliveryRate\Services\PlantDistanceService` (Haversine distance & rate calculation)
- Pages: `resources/js/pages/modules/delivery-rate/{index,form}.tsx`

## Order

- Routes: `/sales/orders`
- Controller: `Modules\Order\Http\Controllers\OrderController`
- Model: `Modules\Order\Models\Order`, `Modules\Order\Models\OrderItem`
- Pages: `resources/js/pages/modules/order/{index,form,show}.tsx`
- Fitur: Sales Order pemesanan, auto-select batching plant terdekat, hitung ongkir otomatis, tracking pemenuhan per item, process stepper alur 4 tahap, dan riwayat ritase Surat Jalan.
- Pembuatan SO dari dashboard saat ini di-hide/dinonaktifkan; seluruh pesanan baru masuk secara otomatis dari aplikasi mobile pelanggan (`customer_id`, `customer_type = B2C`) lewat `CustomerOrderService` / `PlaceOrder`.
- Alur Status: `PENDING_APPROVAL` (menunggu verifikasi sales lapangan via mobile) ➔ `CONFIRMED` (disetujui sales & pembayaran aktif) ➔ `PROCESSING` (saat SPK terbit) ➔ `ON_DELIVERY` (saat SJ terbit) ➔ `COMPLETED` (dikonfirmasi selesai oleh pelanggan di mobile, atau otomatis selesai setelah 2x24 jam / 48 jam). Supir hanya menyelesaikan ritase Surat Jalan (e-POD), tidak otomatis menyelesaikan pesanan.
- ACC verifikasi tempat (dashboard `orders.approve` & mobile `/api/sales/v1/orders/{uuid}/approve`) lewat satu service `Modules\Order\Services\ApproveOrderSite` (aturan validasi `ApproveOrderSite::rules()`): bila pin digeser, sales mengisi **jarak jalan manual** (`distance_km`), atau pilihan **Concrete Pump** (`uses_concrete_pump`) diubah, maka jarak, ongkir, CP, PPN, dan total dihitung ulang. Jarak GPS asli disimpan di `orders.gps_distance_km`; `is_distance_manual` menandai jarak input sales.
- Concrete Pump (CP): tarif flat per pesanan diatur per plant (`batching_plants.concrete_pump_fee`, Master Batching Plant). Hanya untuk kategori `readymix` (`Modules\Order\Services\ConcretePump`). Customer memilih via `use_concrete_pump` di quote/checkout; CP masuk dasar PPN (`OrderTotals`), item Midtrans `CONCRETE-PUMP`.
- Pembayaran tunai lapangan: sales `POST /api/sales/v1/orders/{uuid}/cash-payment` (nominal = total + foto kuitansi) → `payment_method = CASH`, status tetap `PENDING`; admin/keuangan memverifikasi di detail pesanan (`orders.cash-payment.verify|reject`). Service `Modules\Order\Services\CashPayment`.
- Print: Sales Order `GET /sales/orders/{uuid}/print` (blade `order::pdf.sales-order`), SPK `GET /production/work-orders/{uuid}/print` (blade `order::pdf.spk`) — dompdf, dibuka di tab baru.
- Pembatalan pesanan hanya oleh admin (`POST /sales/orders/{uuid}/cancel`, service `CancelOrder`); pesanan lunas wajib catat refund. Endpoint batal pelanggan selalu menolak (422).
- SPK & Surat Jalan wajib pesanan lunas: `Order::readyForProduction()` / `Order::productionBlockReason()`.
- Test alur end-to-end mobile + dashboard: `tests/Feature/MobileTransactionFlowTest.php`.

## WorkOrder

- Routes: `/production/work-orders`
- Controller: `Modules\WorkOrder\Http\Controllers\WorkOrderController`
- Model: `Modules\WorkOrder\Models\WorkOrder`
- Pages: `resources/js/pages/modules/work-order/{index,form,show}.tsx`
- Fitur: Surat Perintah Kerja (SPK) produksi berbasis Sales Order, penjadwalan batching, formula resep mix design, dan slump target. Memicu status pesanan menjadi `PROCESSING`. Proteksi hapus jika sudah memiliki ritase SJ.

## Dispatch

- Routes: `/dispatch/surat-jalan`, `/dispatch/surat-jalan/{uuid}/print`
- Controller: `Modules\Dispatch\Http\Controllers\DispatchController`
- Model: `Modules\Dispatch\Models\SuratJalan`, `Modules\Dispatch\Models\SuratJalanItem`
- Pages: `resources/js/pages/modules/dispatch/{index,form,show,print}.tsx`
- Fitur: Ritase armada, jembatan timbang (gross/tare/netto), telematics IoT, partial delivery, multi-drop combined customer, dan cetak Surat Jalan resmi Tonasa. Penerbitan SJ memicu status order `ON_DELIVERY`; penyelesaian seluruh SJ hanya mengisi `orders.delivered_at` (order selesai lewat konfirmasi pelanggan / auto-finish 48 jam). Form SJ memilih supir terdaftar (`driver_id`) agar SJ muncul di app supir.
- API supir mobile: `/api/driver/v1` (`DriverDeliveryApiController`, middleware `EnsureDriver`).
- Tidak ada `apiResource` master di `/api/v1/*`: guard `auth:sanctum` juga meloloskan token pelanggan/sales/supir, jadi master data hanya lewat web admin.

## PaymentReturn

- Routes: `/finance/payment-returns` (index, create `?order={uuid}`, store, show, `approve`, `reject`, `refund`, `print`)
- Controller: `Modules\PaymentReturn\Http\Controllers\PaymentReturnController`
- Model: `PaymentReturn`, `PaymentReturnItem`, `PaymentReturnApproval` (`Modules\PaymentReturn\Models`)
- Service: `Modules\PaymentReturn\Services\PaymentReturnWorkflow`
- Pages: `resources/js/pages/modules/payment-return/{index,form,show}.tsx`; PDF `paymentreturn::pdf.berita-acara-retur`
- Fitur: Berita Acara retur **pembayaran sebagian** per volume (mis. pesan 10 m³, terpakai 8 m³ → retur 2 m³). Nominal = Σ(volume × harga satuan) + PPN 11%; ongkir & CP tidak dikembalikan. Dibuat admin dari detail pesanan lunas; approval berurutan Manager → Kepala Divisi → Keuangan → Direksi (satu tolak = `REJECTED`), lalu keuangan/admin menandai dana ditransfer (`REFUNDED`) → `orders.refund_amount` bertambah; `payment_status = REFUNDED` hanya bila seluruh tagihan dikembalikan.
- Kode: `BA-RET-{REG}-{YYYYMM}{####}` via `CodeGenerator::nextPaymentReturnCode()`. Data dibatasi per plant (`ScopedByPlant`).

## Report

- Routes: `/laporan/penjualan`, `/laporan/produksi`, `/laporan/distribusi` plus `/excel` dan `/pdf`
- Controller: `App\Http\Controllers\ReportController`
- Page: `resources/js/pages/modules/report/index.tsx`
- Fitur: Filter tanggal dan plant, unduh Excel dan PDF ringkasan.

## Core app

- Dashboard: `App\Http\Controllers\DashboardController` → `pages/dashboard.tsx`
- Auth: Fortify views di `pages/auth/*`
- Middleware alias: `admin` → `EnsureUserIsAdmin`
