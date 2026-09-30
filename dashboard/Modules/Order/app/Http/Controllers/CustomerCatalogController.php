<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Product\Models\Product;

class CustomerCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $category = $request->string('category')->trim()->toString();

        if ($category !== '' && ! in_array($category, ['cement', 'readymix'], true)) {
            abort(422, 'Kategori tidak dikenal.');
        }

        $products = Product::query()
            ->where('is_active', true)
            ->whereIn('category', ['cement', 'readymix'])
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
        if (! $product->is_active || ! in_array($product->category, ['cement', 'readymix'], true)) {
            abort(404);
        }

        return response()->json([
            'data' => $this->transform($product),
        ]);
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
