<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_photos', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('order_id')->nullable()->constrained('orders')->cascadeOnDelete();
            $table->foreignId('surat_jalan_id')->nullable()->constrained('surat_jalans')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 20); // sales | driver
            $table->string('path');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->decimal('accuracy_m', 8, 1)->nullable();
            $table->unsignedInteger('distance_m')->nullable(); // jarak ke titik proyek saat foto diambil
            $table->string('notes', 255)->nullable();
            $table->timestamp('taken_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_photos');
    }
};
