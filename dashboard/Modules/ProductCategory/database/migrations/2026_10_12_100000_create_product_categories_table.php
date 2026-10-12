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
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('slug', 32)->unique();
            $table->string('default_unit', 16)->default('Sak');
            $table->decimal('default_max_trip_capacity', 10, 2)->default(250);
            $table->boolean('default_allow_combined_delivery')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('show_in_catalog')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        $rows = [
            ['CAT-01', 'Ready Mix Concrete', 'readymix', 'm³', 7, false, 1],
            ['CAT-02', 'Semen & Curah', 'cement', 'Sak', 200, true, 2],
            ['CAT-03', 'Mortar & Instan', 'mortar', 'Sak', 250, true, 3],
            ['CAT-04', 'Grout & Spesial', 'grout', 'Sak', 250, true, 4],
            ['CAT-05', 'Admixture & Additive', 'additive', 'Sak', 250, true, 5],
        ];

        foreach ($rows as [$code, $name, $slug, $unit, $capacity, $combined, $sort]) {
            DB::table('product_categories')->insert([
                'uuid' => (string) Str::uuid(),
                'code' => $code,
                'name' => $name,
                'slug' => $slug,
                'default_unit' => $unit,
                'default_max_trip_capacity' => $capacity,
                'default_allow_combined_delivery' => $combined,
                'sort_order' => $sort,
                'show_in_catalog' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $sequence = DB::table('document_sequences')
            ->where('entity', 'product_category')
            ->where('scope', 'GEN')
            ->whereNull('year')
            ->first();

        if ($sequence) {
            if ((int) $sequence->last_number < 5) {
                DB::table('document_sequences')->where('id', $sequence->id)->update([
                    'last_number' => 5,
                    'updated_at' => $now,
                ]);
            }
        } else {
            DB::table('document_sequences')->insert([
                'entity' => 'product_category',
                'scope' => 'GEN',
                'year' => null,
                'last_number' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('category')->constrained('product_categories')->nullOnDelete();
        });

        $ids = DB::table('product_categories')->pluck('id', 'slug');

        foreach (DB::table('products')->select('id', 'category')->get() as $product) {
            $categoryId = $ids[$product->category] ?? null;
            if ($categoryId) {
                DB::table('products')->where('id', $product->id)->update(['category_id' => $categoryId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::dropIfExists('product_categories');
    }
};
