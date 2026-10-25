<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_jalans', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->after('batching_plant_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('surat_jalans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('driver_id');
        });
    }
};
