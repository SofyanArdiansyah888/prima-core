<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductRequest;
use Modules\Product\Http\Requests\UpdateProductRequest;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Services\CodeGenerator;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $category = $request->string('category')->trim()->toString();

        $products = Product::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('tag', 'like', "%{$search}%");
                });
            })
            ->when($category !== '', fn ($q) => $q->where('category', $category))
            ->when($request->has('is_active') && $request->input('is_active') !== '', function ($q) use ($request) {
                $q->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy('category')
            ->orderBy('code')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('modules/product/index', [
            'products' => $products,
            'categories' => ProductCategory::formOptions($category !== '' ? $category : null),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'is_active' => $request->input('is_active'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/product/form', [
            'product' => null,
            'categories' => ProductCategory::formOptions(),
        ]);
    }

    public function store(StoreProductRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $category = ProductCategory::query()->where('slug', $data['category'])->firstOrFail();
        $code = $data['code'] ?? $codes->nextProductCode($category->slug);

        Product::query()->create([
            ...$data,
            'code' => $code,
            'category' => $category->slug,
            'category_id' => $category->id,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('products.index')->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('modules/product/form', [
            'product' => $product,
            'categories' => ProductCategory::formOptions($product->category),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $category = ProductCategory::query()->where('slug', $data['category'])->firstOrFail();
        $product->update([
            ...$data,
            'category' => $category->slug,
            'category_id' => $category->id,
        ]);

        return redirect()->route('products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->update(['is_active' => false]);

        return redirect()->route('products.index')->with('success', 'Produk dinonaktifkan.');
    }
}
