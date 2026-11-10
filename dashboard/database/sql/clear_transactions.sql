-- =====================================================================
-- CLEAR TRANSACTION DATA (PostgreSQL)
-- ---------------------------------------------------------------------
-- Menghapus data transaksi: Order, Item Order, SPK (Work Order),
-- Surat Jalan + item, Foto Lokasi (site_photos), OTP customer,
-- dan me-reset penomoran dokumen transaksi.
--
-- Data master TIDAK disentuh: branches, batching_plants, users,
-- batching_plant_user, customers, products, product_categories,
-- plant_delivery_rates, banners.
--
-- CATATAN: file foto di disk `public` (storage/app/public/site-photos)
-- tidak ikut terhapus oleh query ini — hapus manual bila perlu.
--
-- Pilih SALAH SATU opsi di bawah. Jalankan dalam transaksi agar bisa
-- di-ROLLBACK bila hasil tidak sesuai.
-- =====================================================================


-- =====================================================================
-- OPSI A — HAPUS SEMUA TRANSAKSI (seluruh batching plant)
-- =====================================================================
BEGIN;

TRUNCATE TABLE
    site_photos,
    surat_jalan_items,
    surat_jalans,
    work_orders,
    order_items,
    orders,
    customer_otps
RESTART IDENTITY CASCADE;

DELETE FROM document_sequences
WHERE entity IN ('order', 'work_order', 'surat_jalan');

COMMIT;


-- =====================================================================
-- OPSI B — HAPUS TRANSAKSI UNTUK SATU BATCHING PLANT SAJA
-- Ganti 'BP-XXX-01' dengan kode plant (batching_plants.code).
-- Hapus komentar blok di bawah untuk menjalankan.
-- =====================================================================
/*
BEGIN;

CREATE TEMP TABLE _target_orders ON COMMIT DROP AS
SELECT o.id
FROM orders o
JOIN batching_plants bp ON bp.id = o.batching_plant_id
WHERE bp.code = 'BP-XXX-01';

-- Foto lokasi (sales & sopir)
DELETE FROM site_photos
WHERE order_id IN (SELECT id FROM _target_orders)
   OR surat_jalan_id IN (
        SELECT sj.id FROM surat_jalans sj
        JOIN batching_plants bp ON bp.id = sj.batching_plant_id
        WHERE bp.code = 'BP-XXX-01'
   );

-- Item surat jalan (FK order_id tidak cascade → hapus duluan)
DELETE FROM surat_jalan_items
WHERE order_id IN (SELECT id FROM _target_orders)
   OR surat_jalan_id IN (
        SELECT sj.id FROM surat_jalans sj
        JOIN batching_plants bp ON bp.id = sj.batching_plant_id
        WHERE bp.code = 'BP-XXX-01'
   );

DELETE FROM surat_jalans
WHERE batching_plant_id = (SELECT id FROM batching_plants WHERE code = 'BP-XXX-01');

DELETE FROM work_orders
WHERE order_id IN (SELECT id FROM _target_orders)
   OR batching_plant_id = (SELECT id FROM batching_plants WHERE code = 'BP-XXX-01');

DELETE FROM order_items WHERE order_id IN (SELECT id FROM _target_orders);
DELETE FROM orders      WHERE id       IN (SELECT id FROM _target_orders);

-- Reset nomor SPK & SJ milik plant ini. Scope = 8 karakter terakhir kode
-- plant (huruf besar, tanpa karakter non-alfanumerik) — sama dgn CodeGenerator.
-- Nomor ORDER tidak di-reset karena scope-nya per region (dipakai plant lain).
DELETE FROM document_sequences
WHERE entity IN ('work_order', 'surat_jalan')
  AND scope = RIGHT(REGEXP_REPLACE(UPPER('BP-XXX-01'), '[^A-Z0-9]', '', 'g'), 8);

COMMIT;
*/


-- =====================================================================
-- VERIFIKASI (jalankan setelah clear)
-- =====================================================================
SELECT 'orders' AS tabel, COUNT(*) FROM orders
UNION ALL SELECT 'order_items',       COUNT(*) FROM order_items
UNION ALL SELECT 'work_orders',       COUNT(*) FROM work_orders
UNION ALL SELECT 'surat_jalans',      COUNT(*) FROM surat_jalans
UNION ALL SELECT 'surat_jalan_items', COUNT(*) FROM surat_jalan_items
UNION ALL SELECT 'site_photos',       COUNT(*) FROM site_photos
UNION ALL SELECT 'customer_otps',     COUNT(*) FROM customer_otps
UNION ALL SELECT 'document_sequences (trx)', COUNT(*) FROM document_sequences
          WHERE entity IN ('order', 'work_order', 'surat_jalan');
