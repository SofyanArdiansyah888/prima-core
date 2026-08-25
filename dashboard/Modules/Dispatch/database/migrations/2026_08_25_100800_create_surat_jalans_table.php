<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_jalans', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->foreignId('batching_plant_id')->constrained('batching_plants')->cascadeOnDelete();
            $table->string('vehicle_number', 32); // e.g. "DD 8912 PKM"
            $table->string('vehicle_type', 64)->default('MIXER_TRUCK_7M3'); // MIXER_TRUCK_7M3, BULK_CARRIER_300T, FLATBED_TRUCK
            $table->string('driver_name', 128);
            $table->string('driver_phone', 50)->nullable();
            $table->string('status', 32)->default('PREPARED'); // PREPARED, DEPARTED, ON_THE_WAY, ARRIVED, UNLOADING, COMPLETED, RETURNED
            $table->dateTime('departure_time')->nullable();
            $table->dateTime('arrival_time')->nullable();
            $table->decimal('gross_weight_kg', 10, 2)->nullable();
            $table->decimal('tare_weight_kg', 10, 2)->nullable();
            $table->decimal('net_weight_kg', 10, 2)->nullable();
            $table->string('nota_timbangan_number', 64)->nullable();
            $table->json('telematics')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['batching_plant_id', 'status']);
        });

        Schema::create('surat_jalan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_jalan_id')->constrained('surat_jalans')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('work_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity_delivered', 10, 2);
            $table->string('unit', 16)->default('m³');
            $table->string('destination_customer_name');
            $table->string('destination_project_title')->nullable();
            $table->text('destination_address');
            $table->decimal('destination_lat', 10, 7)->nullable();
            $table->decimal('destination_lng', 10, 7)->nullable();
            $table->unsignedInteger('delivery_sequence')->default(1);
            $table->string('status', 32)->default('ON_TRUCK'); // ON_TRUCK, DELIVERED, REJECTED
            $table->string('recipient_name', 128)->nullable();
            $table->dateTime('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_jalan_items');
        Schema::dropIfExists('surat_jalans');
    }
};
