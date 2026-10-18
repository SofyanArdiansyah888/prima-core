<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Normalize orders.status
        if (Schema::hasTable('orders')) {
            DB::table('orders')
                ->whereIn('status', ['WORK_ORDER_CREATED', 'IN_PRODUCTION'])
                ->update(['status' => 'PROCESSING']);

            DB::table('orders')
                ->where('status', 'PARTIAL_DELIVERY')
                ->update(['status' => 'ON_DELIVERY']);

            DB::table('orders')
                ->where('status', 'DRAFT')
                ->update(['status' => 'CONFIRMED']);

            // 2. Normalize orders.payment_status
            DB::table('orders')
                ->where('payment_status', 'APPROVED_CREDIT')
                ->update(['payment_status' => 'PAID']);

            DB::table('orders')
                ->where('payment_status', 'CHALLENGE')
                ->update(['payment_status' => 'PENDING']);

            DB::table('orders')
                ->where('payment_status', 'REFUNDED')
                ->update(['payment_status' => 'FAILED']);
        }

        // 3. Normalize surat_jalans.status
        if (Schema::hasTable('surat_jalans')) {
            DB::table('surat_jalans')
                ->whereIn('status', ['PREPARED', 'DEPARTED', 'ARRIVED', 'UNLOADING'])
                ->update(['status' => 'ON_THE_WAY']);

            DB::table('surat_jalans')
                ->where('status', 'RETURNED')
                ->update(['status' => 'CANCELLED']);
        }

        // 4. Normalize work_orders.status
        if (Schema::hasTable('work_orders')) {
            DB::table('work_orders')
                ->where('status', 'READY_FOR_DISPATCH')
                ->update(['status' => 'IN_PRODUCTION']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way status simplification; no reversible mapping needed.
    }
};
