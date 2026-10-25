<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('rejection_reason');
            $table->timestamp('customer_confirmed_at')->nullable()->after('delivered_at');
            $table->string('completed_by', 32)->nullable()->after('customer_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'customer_confirmed_at', 'completed_by']);
        });
    }
};
