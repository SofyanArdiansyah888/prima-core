<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('completed_by');
            $table->foreignId('cancelled_by_id')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->text('cancellation_reason')->nullable()->after('cancelled_by_id');
            $table->timestamp('refunded_at')->nullable()->after('cancellation_reason');
            $table->foreignId('refunded_by_id')->nullable()->after('refunded_at')->constrained('users')->nullOnDelete();
            $table->decimal('refund_amount', 15, 2)->nullable()->after('refunded_by_id');
            $table->string('refund_reference', 128)->nullable()->after('refund_amount');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cancelled_by_id');
            $table->dropConstrainedForeignId('refunded_by_id');
            $table->dropColumn(['cancelled_at', 'cancellation_reason', 'refunded_at', 'refund_amount', 'refund_reference']);
        });
    }
};
