<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductRequest;
use Modules\Product\Http\Requests\UpdateProductRequest;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Services\CodeGenerator;
use Modules\Shared\Services\MasterDeletionGuard;

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
            ->when($request->has('is_featured') && $request->input('is_featured') !== '', function ($q) use ($request) {
                $q->where('is_featured', filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN));
            })
            ->when($request->has('is_best_seller') && $request->input('is_best_seller') !== '', function ($q) use ($request) {
                $q->where('is_best_seller', filter_var($request->input('is_best_seller'), FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy('category')
            ->orderBy('code')
            ->paginate(12)
            ->withQueryString();

        $products->through(function (Product $p) {
            $p->setAttribute('image_url', $p->imageUrl());

            return $p;
        });

        return Inertia::render('modules/product/index', [
            'products' => $products,
            'categories' => ProductCategory::formOptions($category !== '' ? $category : null),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'is_active' => $request->input('is_active'),
                'is_featured' => $request->input('is_featured'),
                'is_best_seller' => $request->input('is_best_seller'),
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

        $path = $request->file('image')?->store('products', 'public');

        Product::query()->create([
            ...$data,
            'code' => $code,
            'category' => $category->slug,
            'category_id' => $category->id,
            'image_path' => $path,
            'is_featured' => $data['is_featured'] ?? false,
            'is_best_seller' => $data['is_best_seller'] ?? false,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('products.index')->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(Product $product): Response
    {
        $product->setAttribute('image_url', $product->imageUrl());

        return Inertia::render('modules/product/form', [
            'product' => $product,
            'categories' => ProductCategory::formOptions($product->category),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $category = ProductCategory::query()->where('slug', $data['category'])->firstOrFail();

        $path = $product->image_path;
        if ($request->hasFile('image')) {
            if ($path && ! str_starts_with($path, 'http://') && ! str_starts_with($path, 'https://')) {
                Storage::disk('public')->delete($path);
            }
            $path = $request->file('image')->store('products', 'public');
        }

        $product->update([
            ...$data,
            'category' => $category->slug,
            'category_id' => $category->id,
            'image_path' => $path,
            'is_featured' => $data['is_featured'] ?? false,
            'is_best_seller' => $data['is_best_seller'] ?? false,
        ]);

        return redirect()->route('products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product, MasterDeletionGuard $guard): RedirectResponse
    {
        $error = $guard->checkProduct($product);
        if ($error !== null) {
            return back()->with('error', $error);
        }

        try {
            $path = $product->image_path;
            if ($path && ! str_starts_with($path, 'http://') && ! str_starts_with($path, 'https://')) {
                Storage::disk('public')->delete($path);
            }

            $name = $product->name;
            $product->delete();

            return redirect()->route('products.index')->with('success', "Produk '{$name}' berhasil dihapus.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal menghapus produk: data masih memiliki ketergantungan lain.');
        }
    }
}
