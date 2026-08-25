<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->string('customer_name');
            $table->string('customer_phone', 50)->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_type', 32)->default('B2C'); // B2C, B2B_PARTNER
            $table->string('project_title');
            $table->text('delivery_address');
            $table->decimal('delivery_lat', 10, 7)->nullable();
            $table->decimal('delivery_lng', 10, 7)->nullable();
            $table->foreignId('batching_plant_id')->nullable()->constrained('batching_plants')->nullOnDelete();
            $table->decimal('distance_km', 8, 2)->default(0);
            $table->decimal('delivery_fee', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('ppn', 15, 2)->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->string('payment_method', 64)->nullable(); // VA_MANDIRI, VA_BRI, CREDIT_B2B, CASH
            $table->string('payment_status', 32)->default('PENDING'); // PENDING, PAID, APPROVED_CREDIT
            $table->string('status', 32)->default('CONFIRMED'); // DRAFT, CONFIRMED, IN_PRODUCTION, PARTIAL_DELIVERY, COMPLETED, CANCELLED
            $table->string('po_number', 64)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['batching_plant_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity', 10, 2);
            $table->decimal('fulfilled_quantity', 10, 2)->default(0);
            $table->string('unit', 16)->default('m³');
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
