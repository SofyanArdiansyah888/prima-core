<?php

namespace Modules\ProductCategory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\ProductCategory\Http\Requests\StoreProductCategoryRequest;
use Modules\ProductCategory\Http\Requests\UpdateProductCategoryRequest;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Services\CodeGenerator;

class ProductCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $categories = ProductCategory::query()
            ->withCount('products')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->orderBy('code')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('modules/product-category/index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/product-category/form', [
            'category' => null,
        ]);
    }

    public function store(StoreProductCategoryRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();

        ProductCategory::query()->create([
            'code' => $codes->nextCategoryCode(),
            'name' => $data['name'],
            'slug' => $data['slug'],
            'default_unit' => $data['default_unit'],
            'default_max_trip_capacity' => $data['default_max_trip_capacity'],
            'default_allow_combined_delivery' => $data['default_allow_combined_delivery'],
            'sort_order' => $data['sort_order'] ?? 0,
            'show_in_catalog' => $data['show_in_catalog'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('product-categories.index')->with('success', 'Kategori produk berhasil dibuat.');
    }

    public function edit(ProductCategory $product_category): Response
    {
        $product_category->loadCount('products');

        return Inertia::render('modules/product-category/form', [
            'category' => $product_category,
        ]);
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $product_category): RedirectResponse
    {
        $product_category->update($request->validated());

        return redirect()->route('product-categories.index')->with('success', 'Kategori produk berhasil diperbarui.');
    }

    public function destroy(ProductCategory $product_category): RedirectResponse
    {
        $product_category->update(['is_active' => false]);

        return redirect()->route('product-categories.index')->with('success', 'Kategori produk dinonaktifkan.');
    }
}
