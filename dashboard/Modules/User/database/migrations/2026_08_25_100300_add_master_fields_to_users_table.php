<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->string('code', 32)->nullable()->unique()->after('uuid');
            $table->string('role', 16)->default('user')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->foreignId('branch_id')->nullable()->after('is_active')->constrained('branches')->nullOnDelete();
        });

        Schema::create('batching_plant_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('batching_plant_id')->constrained('batching_plants')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'batching_plant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batching_plant_user');

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn(['uuid', 'code', 'role', 'is_active']);
        });
    }
};
