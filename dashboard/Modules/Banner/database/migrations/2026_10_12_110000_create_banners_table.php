<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->string('badge', 80);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cta_label', 80);
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('image_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        $now = now();
        $categoryIds = DB::table('product_categories')->pluck('id', 'slug');
        $slides = [
            ['BNR-01', '★ Produk Unggulan', 'Ready Mix Untuk Proyek Anda', 'Kualitas terjamin, pasokan tepat waktu, untuk hasil pembangunan terbaik.', 'Lihat Produk', 'readymix', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=600', 1],
            ['BNR-02', '★ Semen Standar SNI', 'Semen Portland Kokoh & Rekat', 'Daya ikat kuat untuk pondasi, plesteran, dan konstruksi struktural tahan lama.', 'Pesan Semen', 'cement', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600', 2],
            ['BNR-03', '★ Layanan Armada Batching Plant', 'Distribusi Cepat & Slump Akurat', 'Didukung armada mixer prima siap melayani pengecoran proyek Anda.', 'Cek Armada', 'readymix', 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=600', 3],
        ];

        foreach ($slides as [$code, $badge, $title, $description, $cta, $slug, $image, $sort]) {
            DB::table('banners')->insert([
                'uuid' => (string) Str::uuid(),
                'code' => $code,
                'badge' => $badge,
                'title' => $title,
                'description' => $description,
                'cta_label' => $cta,
                'category_id' => $categoryIds[$slug] ?? null,
                'image_path' => $image,
                'sort_order' => $sort,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $sequence = DB::table('document_sequences')
            ->where('entity', 'banner')
            ->where('scope', 'GEN')
            ->whereNull('year')
            ->first();

        if (! $sequence) {
            DB::table('document_sequences')->insert([
                'entity' => 'banner',
                'scope' => 'GEN',
                'year' => null,
                'last_number' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
