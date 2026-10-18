<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('category_id');
            $table->boolean('is_featured')->default(false)->after('is_active')->index();
            $table->boolean('is_best_seller')->default(false)->after('is_featured')->index();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_featured']);
            $table->dropIndex(['is_best_seller']);
            $table->dropColumn(['image_path', 'is_featured', 'is_best_seller']);
        });
    }
};
