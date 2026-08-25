<?php

namespace Modules\Order\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\Shared\Services\CodeGenerator;

class OrderDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $codeGen = app(CodeGenerator::class);
        $plantPangkep = BatchingPlant::where('code', 'like', '%BP-01%')->first() ?? BatchingPlant::first();
        $plantMakassar = BatchingPlant::where('code', 'like', '%BP-02%')->first() ?? BatchingPlant::first();

        $prodK300 = Product::where('code', 'RM-K300')->first();
        $prodBulk = Product::where('code', 'ST-BULK-300T')->first();
        $prodOpc = Product::where('code', 'ST-OPC-50KG')->first();

        // 1. Order Ready Mix 21 m³ (PT Mitra Kontraktor Utama)
        if ($prodK300 && $plantPangkep) {
            $order1 = Order::query()->updateOrCreate(
                ['code' => 'SO-SULSEL-2026080001'],
                [
                    'customer_name' => 'PT Mitra Kontraktor Utama',
                    'customer_phone' => '0811-420-9988',
                    'customer_email' => 'procurement@mitrakontraktor.co.id',
                    'customer_type' => 'B2B_PARTNER',
                    'project_title' => 'Pembangunan Perumahan Green Minasa Blok B4',
                    'delivery_address' => 'Jl. Poros Tonasa II, Bontoa, Kab. Pangkep',
                    'delivery_lat' => -4.8050000,
                    'delivery_lng' => 119.5610000,
                    'batching_plant_id' => $plantPangkep->id,
                    'distance_km' => 3.20,
                    'delivery_fee' => 450000,
                    'subtotal' => 18690000,
                    'ppn' => 2055900,
                    'total_price' => 21195900,
                    'payment_method' => 'CREDIT_B2B',
                    'payment_status' => 'APPROVED_CREDIT',
                    'status' => 'IN_PRODUCTION',
                    'po_number' => 'PO-MKU/PKM/2026/042',
                    'notes' => 'Pengecoran slab dak lantai 2, slump 12cm.',
                ]
            );

            OrderItem::query()->updateOrCreate(
                ['order_id' => $order1->id, 'product_id' => $prodK300->id],
                [
                    'quantity' => 21.00,
                    'fulfilled_quantity' => 7.00, // 1 mixer telah terkirim dari 3 mixer
                    'unit' => 'm³',
                    'unit_price' => 890000,
                    'subtotal' => 18690000,
                    'notes' => '3 rit truk mixer @ 7 m³',
                ]
            );
        }

        // 2. Order Semen Curah 500 Ton (PT Beton Perkasa Nusantara - Kasus > 300 Ton / multi trip)
        if ($prodBulk && $plantMakassar) {
            $order2 = Order::query()->updateOrCreate(
                ['code' => 'SO-SULSEL-2026080002'],
                [
                    'customer_name' => 'PT Beton Perkasa Nusantara',
                    'customer_phone' => '0812-9988-1122',
                    'customer_email' => 'logistics@betonperkasa.com',
                    'customer_type' => 'B2B_PARTNER',
                    'project_title' => 'Proyek Dermaga & Silo Pelabuhan Makassar Baru',
                    'delivery_address' => 'Kawasan Pelabuhan Makassar New Port (MNP)',
                    'delivery_lat' => -5.1050000,
                    'delivery_lng' => 119.4320000,
                    'batching_plant_id' => $plantMakassar->id,
                    'distance_km' => 6.80,
                    'delivery_fee' => 3500000,
                    'subtotal' => 625000000,
                    'ppn' => 68750000,
                    'total_price' => 697250000,
                    'payment_method' => 'CREDIT_B2B',
                    'payment_status' => 'APPROVED_CREDIT',
                    'status' => 'PARTIAL_DELIVERY',
                    'po_number' => 'PO-BPN/TONASA/VIII/2026',
                    'notes' => 'Pengiriman 500 Ton dengan armada curah max 300 Ton (2 ritase trip: 300T + 200T).',
                ]
            );

            OrderItem::query()->updateOrCreate(
                ['order_id' => $order2->id, 'product_id' => $prodBulk->id],
                [
                    'quantity' => 500.00,
                    'fulfilled_quantity' => 300.00, // 1 trip 300T sudah selesai
                    'unit' => 'Ton',
                    'unit_price' => 1250000,
                    'subtotal' => 625000000,
                    'notes' => 'Kapasitas kapal/truk kapsul 300 Ton/trip',
                ]
            );
        }

        // 3. Order Semen Sak Customer A (Toko Bangunan Berkah Makassar - 100 Sak)
        if ($prodOpc && $plantMakassar) {
            $order3 = Order::query()->updateOrCreate(
                ['code' => 'SO-SULSEL-2026080003'],
                [
                    'customer_name' => 'Toko Bangunan Berkah Makassar',
                    'customer_phone' => '0852-7711-2233',
                    'customer_email' => 'tbberkah@gmail.com',
                    'customer_type' => 'B2C',
                    'project_title' => 'Suplai Ritel Toko TB Berkah - Urip Sumoharjo',
                    'delivery_address' => 'Jl. Urip Sumoharjo No. 120, Panakkukang, Makassar',
                    'delivery_lat' => -5.1380000,
                    'delivery_lng' => 119.4450000,
                    'batching_plant_id' => $plantMakassar->id,
                    'distance_km' => 5.50,
                    'delivery_fee' => 200000,
                    'subtotal' => 7800000,
                    'ppn' => 858000,
                    'total_price' => 8858000,
                    'payment_method' => 'VA_MANDIRI',
                    'payment_status' => 'PAID',
                    'status' => 'CONFIRMED',
                    'notes' => 'Bisa digabung pengantaran dengan toko sejalur.',
                ]
            );

            OrderItem::query()->updateOrCreate(
                ['order_id' => $order3->id, 'product_id' => $prodOpc->id],
                [
                    'quantity' => 100.00,
                    'fulfilled_quantity' => 100.00,
                    'unit' => 'Sak',
                    'unit_price' => 78000,
                    'subtotal' => 7800000,
                ]
            );

            // 4. Order Semen Sak Customer B (CV Sinar Maros Jaya - 80 Sak)
            $order4 = Order::query()->updateOrCreate(
                ['code' => 'SO-SULSEL-2026080004'],
                [
                    'customer_name' => 'CV Sinar Maros Jaya',
                    'customer_phone' => '0813-4455-6677',
                    'customer_email' => 'sinarmaros@yahoo.com',
                    'customer_type' => 'B2C',
                    'project_title' => 'Suplai Pembangunan Ruko Daya Square',
                    'delivery_address' => 'Jl. Perintis Kemerdekaan Km 14, Biringkanaya, Makassar',
                    'delivery_lat' => -5.1180000,
                    'delivery_lng' => 119.5120000,
                    'batching_plant_id' => $plantMakassar->id,
                    'distance_km' => 4.20,
                    'delivery_fee' => 180000,
                    'subtotal' => 6240000,
                    'ppn' => 686400,
                    'total_price' => 7106400,
                    'payment_method' => 'VA_BRI',
                    'payment_status' => 'PAID',
                    'status' => 'CONFIRMED',
                    'notes' => 'Digabung dengan TB Berkah dlm 1 armada Flatbed.',
                ]
            );

            OrderItem::query()->updateOrCreate(
                ['order_id' => $order4->id, 'product_id' => $prodOpc->id],
                [
                    'quantity' => 80.00,
                    'fulfilled_quantity' => 80.00,
                    'unit' => 'Sak',
                    'unit_price' => 78000,
                    'subtotal' => 6240000,
                ]
            );
        }
    }
}
