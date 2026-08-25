<?php

namespace Modules\Dispatch\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;

class DispatchDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $plantPangkep = BatchingPlant::where('code', 'like', '%BP-01%')->first() ?? BatchingPlant::first();
        $plantMakassar = BatchingPlant::where('code', 'like', '%BP-02%')->first() ?? BatchingPlant::first();

        $order1 = Order::where('code', 'SO-SULSEL-2026080001')->first();
        $order2 = Order::where('code', 'SO-SULSEL-2026080002')->first();
        $order3 = Order::where('code', 'SO-SULSEL-2026080003')->first();
        $order4 = Order::where('code', 'SO-SULSEL-2026080004')->first();

        $wo1 = WorkOrder::where('code', 'WO-BP01-2026080001')->first();
        $wo2 = WorkOrder::where('code', 'WO-BP02-2026080001')->first();

        $prodK300 = Product::where('code', 'RM-K300')->first();
        $prodBulk = Product::where('code', 'ST-BULK-300T')->first();
        $prodOpc = Product::where('code', 'ST-OPC-50KG')->first();

        // 1. Single Customer Dispatch: Ready Mix K-300 (Mixer Truck)
        if ($plantPangkep && $order1 && $prodK300) {
            $sj1 = SuratJalan::query()->updateOrCreate(
                ['code' => 'SJ-BP01-2026080001'],
                [
                    'batching_plant_id' => $plantPangkep->id,
                    'vehicle_number' => 'DD 8912 PKM (Mixer #04)',
                    'vehicle_type' => 'MIXER_TRUCK_7M3',
                    'driver_name' => 'Pak Syamsuddin',
                    'driver_phone' => '0812-4112-9901',
                    'status' => 'ON_THE_WAY',
                    'departure_time' => now()->subMinutes(35),
                    'gross_weight_kg' => 28450,
                    'tare_weight_kg' => 11200,
                    'net_weight_kg' => 17250,
                    'nota_timbangan_number' => 'NT-PKM-9912',
                    'telematics' => [
                        'speedKm' => 42,
                        'drumRotationRpm' => 12,
                        'concreteTempC' => 31.5,
                        'slumpValue' => '12.5 cm',
                        'currentLocationName' => 'Jl. Poros Pangkep Km 4 (2.3 km dari lokasi proyek)',
                    ],
                    'notes' => 'Pengantaran ritase 1 dari total 3 ritase Ready Mix K-300.',
                ]
            );

            SuratJalanItem::query()->updateOrCreate(
                ['surat_jalan_id' => $sj1->id, 'order_id' => $order1->id],
                [
                    'work_order_id' => $wo1?->id,
                    'product_id' => $prodK300->id,
                    'quantity_delivered' => 7.00,
                    'unit' => 'm³',
                    'destination_customer_name' => $order1->customer_name,
                    'destination_project_title' => $order1->project_title,
                    'destination_address' => $order1->delivery_address,
                    'destination_lat' => $order1->delivery_lat,
                    'destination_lng' => $order1->delivery_lng,
                    'delivery_sequence' => 1,
                    'status' => 'ON_TRUCK',
                    'recipient_name' => 'Pak Ahmad (Pelaksana Lapangan)',
                ]
            );
        }

        // 2. Single Customer Dispatch: Semen Curah 300 Ton (Ritase 1 dari order 500 Ton)
        if ($plantMakassar && $order2 && $prodBulk) {
            $sj2 = SuratJalan::query()->updateOrCreate(
                ['code' => 'SJ-BP02-2026080001'],
                [
                    'batching_plant_id' => $plantMakassar->id,
                    'vehicle_number' => 'DD 7721 PKM (Bulk Silo #02)',
                    'vehicle_type' => 'BULK_CARRIER_300T',
                    'driver_name' => 'Pak Basri Rahman',
                    'driver_phone' => '0852-8811-0022',
                    'status' => 'COMPLETED',
                    'departure_time' => now()->subHours(4),
                    'arrival_time' => now()->subHours(2),
                    'gross_weight_kg' => 342000,
                    'tare_weight_kg' => 42000,
                    'net_weight_kg' => 300000,
                    'nota_timbangan_number' => 'NT-PKM-9915',
                    'telematics' => [
                        'status' => 'Bongkar Curah ke Silo Selesai',
                        'temperature' => '29.0 C',
                    ],
                    'notes' => 'Ritase 1 (300 Ton) selesai diterima di Dermaga Silo MNP.',
                ]
            );

            SuratJalanItem::query()->updateOrCreate(
                ['surat_jalan_id' => $sj2->id, 'order_id' => $order2->id],
                [
                    'work_order_id' => $wo2?->id,
                    'product_id' => $prodBulk->id,
                    'quantity_delivered' => 300.00,
                    'unit' => 'Ton',
                    'destination_customer_name' => $order2->customer_name,
                    'destination_project_title' => $order2->project_title,
                    'destination_address' => $order2->delivery_address,
                    'destination_lat' => $order2->delivery_lat,
                    'destination_lng' => $order2->delivery_lng,
                    'delivery_sequence' => 1,
                    'status' => 'DELIVERED',
                    'recipient_name' => 'Bpk. Hendra Wijaya',
                    'received_at' => now()->subHours(2),
                ]
            );
        }

        // 3. Combined / Multi-Drop Delivery: Semen Tonasa Sak (TB Berkah + CV Sinar Maros Jaya)
        if ($plantMakassar && $order3 && $order4 && $prodOpc) {
            $sj3 = SuratJalan::query()->updateOrCreate(
                ['code' => 'SJ-BP02-2026080002'],
                [
                    'batching_plant_id' => $plantMakassar->id,
                    'vehicle_number' => 'DD 8820 PKM (Flatbed Truck)',
                    'vehicle_type' => 'FLATBED_SAK',
                    'driver_name' => 'Pak Ilham Nur',
                    'driver_phone' => '0821-3344-5566',
                    'status' => 'DEPARTED',
                    'departure_time' => now()->subMinutes(15),
                    'gross_weight_kg' => 19500,
                    'tare_weight_kg' => 10500,
                    'net_weight_kg' => 9000, // 180 Sak @ 50kg = 9000kg
                    'nota_timbangan_number' => 'NT-PKM-9920',
                    'notes' => 'Pengantaran gabungan 2 customer: Stop 1 TB Berkah (100 Sak) & Stop 2 CV Sinar Maros (80 Sak).',
                ]
            );

            // Drop 1: TB Berkah (100 Sak)
            SuratJalanItem::query()->updateOrCreate(
                ['surat_jalan_id' => $sj3->id, 'order_id' => $order3->id],
                [
                    'product_id' => $prodOpc->id,
                    'quantity_delivered' => 100.00,
                    'unit' => 'Sak',
                    'destination_customer_name' => $order3->customer_name,
                    'destination_project_title' => $order3->project_title,
                    'destination_address' => $order3->delivery_address,
                    'destination_lat' => $order3->delivery_lat,
                    'destination_lng' => $order3->delivery_lng,
                    'delivery_sequence' => 1,
                    'status' => 'ON_TRUCK',
                    'recipient_name' => 'Bpk. H. Rasyid',
                ]
            );

            // Drop 2: CV Sinar Maros Jaya (80 Sak)
            SuratJalanItem::query()->updateOrCreate(
                ['surat_jalan_id' => $sj3->id, 'order_id' => $order4->id],
                [
                    'product_id' => $prodOpc->id,
                    'quantity_delivered' => 80.00,
                    'unit' => 'Sak',
                    'destination_customer_name' => $order4->customer_name,
                    'destination_project_title' => $order4->project_title,
                    'destination_address' => $order4->delivery_address,
                    'destination_lat' => $order4->delivery_lat,
                    'destination_lng' => $order4->delivery_lng,
                    'delivery_sequence' => 2,
                    'status' => 'ON_TRUCK',
                    'recipient_name' => 'Ibu Marlina',
                ]
            );
        }
    }
}
