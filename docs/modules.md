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
- Model: `Modules\BatchingPlant\Models\BatchingPlant` (`branch_id` FK)
- Pages: `resources/js/pages/modules/batching-plant/{index,form}.tsx`

## User

- Routes: `/master/users`
- Controller: `Modules\User\Http\Controllers\UserController`
- Model auth: `App\Models\User` (Fortify)
- Pages: `resources/js/pages/modules/user/{index,form}.tsx`
- Sync: `batching_plant_ids[]` → pivot `batching_plant_user`

## Customer

- Path: `dashboard/Modules/Customer`
- Model: `Modules\Customer\Models\Customer` (terpisah dari user staf)
- API: `/api/customer/v1` — daftar, masuk, profil, katalog, quote ongkir, buat/lacak/batal pesanan B2C
- App: [`mobile/`](../mobile/) Ionic React + Tailwind
- Seed lokal: `081300000001` / `password`

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
- Fitur: Sales Order pemesanan, auto-select batching plant terdekat, hitung ongkir otomatis, tracking pemenuhan per item.
- Pesanan aplikasi pelanggan masuk ke tabel yang sama (`customer_id`, `customer_type = B2C`) lewat `PlaceOrder`.

## WorkOrder

- Routes: `/production/work-orders`
- Controller: `Modules\WorkOrder\Http\Controllers\WorkOrderController`
- Model: `Modules\WorkOrder\Models\WorkOrder`
- Pages: `resources/js/pages/modules/work-order/{index,form,show}.tsx`
- Fitur: Surat Perintah Kerja (SPK) produksi berbasis Sales Order, penjadwalan batching, formula resep mix design, dan slump target.

## Dispatch

- Routes: `/dispatch/surat-jalan`, `/dispatch/surat-jalan/{uuid}/print`
- Controller: `Modules\Dispatch\Http\Controllers\DispatchController`
- Model: `Modules\Dispatch\Models\SuratJalan`, `Modules\Dispatch\Models\SuratJalanItem`
- Pages: `resources/js/pages/modules/dispatch/{index,form,show,print}.tsx`
- Fitur: Ritase armada, jembatan timbang (gross/tare/netto), telematics IoT, partial delivery, multi-drop combined customer, dan cetak Surat Jalan resmi Tonasa.

## Core app

- Dashboard: `App\Http\Controllers\DashboardController` → `pages/dashboard.tsx`
- Auth: Fortify views di `pages/auth/*`
- Middleware alias: `admin` → `EnsureUserIsAdmin`
