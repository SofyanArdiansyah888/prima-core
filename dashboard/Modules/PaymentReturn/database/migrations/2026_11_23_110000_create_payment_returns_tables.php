<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_returns', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 40)->unique();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('batching_plant_id')->nullable()->constrained('batching_plants')->nullOnDelete();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('ppn', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->text('reason');
            $table->string('customer_bank_name', 100)->nullable();
            $table->string('customer_bank_account', 50)->nullable();
            $table->string('customer_account_name', 150)->nullable();
            $table->string('status', 24)->default('PENDING_MANAGER')->index();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->foreignId('refunded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('refund_reference', 150)->nullable();
            $table->timestamps();
        });

        Schema::create('payment_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_return_id')->constrained('payment_returns')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        Schema::create('payment_return_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_return_id')->constrained('payment_returns')->cascadeOnDelete();
            $table->string('step', 24);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('decision', 16);
            $table->text('notes')->nullable();
            $table->timestamp('decided_at');
            $table->timestamps();

            $table->unique(['payment_return_id', 'step']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_return_approvals');
        Schema::dropIfExists('payment_return_items');
        Schema::dropIfExists('payment_returns');
    }
};
