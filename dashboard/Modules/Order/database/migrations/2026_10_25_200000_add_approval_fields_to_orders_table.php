<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('approved_at')->nullable()->after('status');
            $table->foreignId('approved_by_id')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            $table->text('survey_notes')->nullable()->after('approved_by_id');
            $table->text('rejection_reason')->nullable()->after('survey_notes');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by_id');
            $table->dropColumn(['approved_at', 'survey_notes', 'rejection_reason']);
        });
    }
};
