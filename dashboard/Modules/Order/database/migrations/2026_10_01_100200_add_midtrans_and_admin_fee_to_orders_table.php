<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('admin_fee', 15, 2)->default(0)->after('delivery_fee');
            $table->string('snap_token')->nullable()->after('payment_status');
            $table->text('snap_redirect_url')->nullable()->after('snap_token');
            $table->string('midtrans_transaction_id')->nullable()->after('snap_redirect_url');
            $table->string('midtrans_payment_type', 64)->nullable()->after('midtrans_transaction_id');
            $table->json('payment_payload')->nullable()->after('midtrans_payment_type');
            $table->timestamp('paid_at')->nullable()->after('payment_payload');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'admin_fee',
                'snap_token',
                'snap_redirect_url',
                'midtrans_transaction_id',
                'midtrans_payment_type',
                'payment_payload',
                'paid_at',
            ]);
        });
    }
};
