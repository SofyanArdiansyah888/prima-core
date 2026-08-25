<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plant_delivery_rates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('batching_plant_id')->constrained('batching_plants')->cascadeOnDelete();
            $table->string('product_category', 32)->nullable(); // null = all, or readymix, cement, etc.
            $table->decimal('min_distance_km', 8, 2)->default(0);
            $table->decimal('max_distance_km', 8, 2)->default(50);
            $table->string('rate_type', 32)->default('PER_UNIT_PER_KM'); // FLAT_PER_TRIP, PER_UNIT_PER_KM, TIER_RADIUS
            $table->decimal('base_fee', 15, 2)->default(0);
            $table->decimal('cost_per_km_unit', 15, 2)->default(0);
            $table->decimal('min_charge', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['batching_plant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_delivery_rates');
    }
};
