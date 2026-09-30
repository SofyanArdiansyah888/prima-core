<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('entity', 64);
            $table->string('scope', 64);
            $table->unsignedInteger('year')->nullable();
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(['entity', 'scope', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
