<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Concrete Pump (CP)
            $table->boolean('uses_concrete_pump')->default(false)->after('delivery_fee');
            $table->decimal('concrete_pump_fee', 15, 2)->default(0)->after('uses_concrete_pump');

            // Jarak: distance_km = jarak yang dipakai ongkir; gps_distance_km = hasil GPS (pembanding)
            $table->decimal('gps_distance_km', 8, 2)->nullable()->after('distance_km');
            $table->boolean('is_distance_manual')->default(false)->after('gps_distance_km');

            // Pembayaran tunai dicatat sales di lapangan, diverifikasi admin/keuangan
            $table->decimal('cash_payment_amount', 15, 2)->nullable();
            $table->string('cash_payment_proof_path')->nullable();
            $table->string('cash_payment_notes', 500)->nullable();
            $table->foreignId('cash_recorded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cash_recorded_at')->nullable();
            $table->foreignId('cash_verified_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cash_verified_at')->nullable();
            $table->string('cash_rejection_reason', 500)->nullable();
        });

        DB::table('orders')->whereNull('gps_distance_km')->update(['gps_distance_km' => DB::raw('distance_km')]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cash_recorded_by_id');
            $table->dropConstrainedForeignId('cash_verified_by_id');
            $table->dropColumn([
                'uses_concrete_pump',
                'concrete_pump_fee',
                'gps_distance_km',
                'is_distance_manual',
                'cash_payment_amount',
                'cash_payment_proof_path',
                'cash_payment_notes',
                'cash_recorded_at',
                'cash_verified_at',
                'cash_rejection_reason',
            ]);
        });
    }
};
