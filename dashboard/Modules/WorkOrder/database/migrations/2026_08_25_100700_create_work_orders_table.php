<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products');
            $table->foreignId('batching_plant_id')->constrained('batching_plants')->cascadeOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('scheduled_date');
            $table->string('scheduled_time_slot', 64)->nullable(); // e.g. "08:00 - 11:00 WITA"
            $table->decimal('target_quantity', 10, 2);
            $table->decimal('produced_quantity', 10, 2)->default(0);
            $table->decimal('dispatched_quantity', 10, 2)->default(0);
            $table->string('unit', 16)->default('m³');
            $table->string('status', 32)->default('SCHEDULED'); // SCHEDULED, IN_PRODUCTION, READY_FOR_DISPATCH, COMPLETED, CANCELLED
            $table->string('batch_recipe_code', 64)->nullable();
            $table->string('slump_target', 64)->nullable();
            $table->text('production_notes')->nullable();
            $table->timestamps();

            $table->index(['batching_plant_id', 'status', 'scheduled_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_orders');
    }
};
