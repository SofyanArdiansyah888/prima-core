<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;

class CustomerCatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = ProductCategory::query()
            ->where('is_active', true)
            ->where('show_in_catalog', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['slug', 'name', 'default_unit']);

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $category = $request->string('category')->trim()->toString();
        $slugs = $this->catalogSlugs();

        if ($category !== '' && ! in_array($category, $slugs, true)) {
            abort(422, 'Kategori tidak dikenal.');
        }

        $products = Product::query()
            ->with('productCategory:id,name,slug')
            ->where('is_active', true)
            ->whereIn('category', $slugs)
            ->when($category !== '', fn ($query) => $query->where('category', $category))
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => $this->transform($product))
            ->values();

        return response()->json([
            'data' => $products,
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load('productCategory:id,name,slug');

        if (! $product->is_active || ! in_array($product->category, $this->catalogSlugs(), true)) {
            abort(404);
        }

        return response()->json([
            'data' => $this->transform($product),
        ]);
    }

    /**
     * @return list<string>
     */
    private function catalogSlugs(): array
    {
        return ProductCategory::query()
            ->where('is_active', true)
            ->where('show_in_catalog', true)
            ->pluck('slug')
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(Product $product): array
    {
        return [
            'uuid' => $product->uuid,
            'code' => $product->code,
            'name' => $product->name,
            'category' => $product->category,
            'category_name' => $product->productCategory?->name,
            'unit' => $product->unit,
            'base_price' => (float) $product->base_price,
            'min_order' => (float) $product->min_order,
            'slump' => $product->slump,
            'recommended_for' => $product->recommended_for,
            'description' => $product->description,
            'tag' => $product->tag,
            'specs' => $product->specs,
        ];
    }
}
