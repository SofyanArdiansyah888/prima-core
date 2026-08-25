<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('category', 32); // readymix, cement, mortar, grout, additive
            $table->string('unit', 16)->default('m³'); // m³, Sak, Ton, Kg
            $table->decimal('base_price', 15, 2)->default(0);
            $table->decimal('max_trip_capacity', 10, 2)->default(7); // kapasitas max per armada
            $table->boolean('allow_combined_delivery')->default(false); // true jika bisa campur customer dlm 1 armada
            $table->decimal('min_order', 10, 2)->default(1);
            $table->string('slump', 64)->nullable();
            $table->text('recommended_for')->nullable();
            $table->text('description')->nullable();
            $table->string('tag', 64)->nullable();
            $table->json('specs')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
