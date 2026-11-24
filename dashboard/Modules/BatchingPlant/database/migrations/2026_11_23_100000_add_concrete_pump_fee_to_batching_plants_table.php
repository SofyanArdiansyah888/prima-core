<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batching_plants', function (Blueprint $table) {
            // Tarif flat Concrete Pump (CP) per pesanan; 0 = plant tidak menyediakan CP.
            $table->decimal('concrete_pump_fee', 15, 2)->default(0)->after('whatsapp');
        });
    }

    public function down(): void
    {
        Schema::table('batching_plants', function (Blueprint $table) {
            $table->dropColumn('concrete_pump_fee');
        });
    }
};
