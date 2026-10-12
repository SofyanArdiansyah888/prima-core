<?php

namespace Modules\Banner\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Banner\Http\Requests\StoreBannerRequest;
use Modules\Banner\Http\Requests\UpdateBannerRequest;
use Modules\Banner\Models\Banner;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\Shared\Services\CodeGenerator;

class BannerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $banners = Banner::query()
            ->with('category:id,name,slug')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->orderBy('code')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Banner $banner) {
                $banner->setAttribute('image_url', $banner->imageUrl());

                return $banner;
            });

        return Inertia::render('modules/banner/index', [
            'banners' => $banners,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('modules/banner/form', [
            'banner' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(StoreBannerRequest $request, CodeGenerator $codes): RedirectResponse
    {
        $data = $request->validated();
        $path = $request->file('image')?->store('banners', 'public');

        Banner::query()->create([
            'code' => $codes->nextBannerCode(),
            'badge' => $data['badge'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'cta_label' => $data['cta_label'],
            'category_id' => $data['category_id'] ?? null,
            'image_path' => $path,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return redirect()->route('banners.index')->with('success', 'Banner berhasil dibuat.');
    }

    public function edit(Banner $banner): Response
    {
        $banner->setAttribute('image_url', $banner->imageUrl());

        return Inertia::render('modules/banner/form', [
            'banner' => $banner,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(UpdateBannerRequest $request, Banner $banner): RedirectResponse
    {
        $data = $request->validated();
        $path = $banner->image_path;

        if ($request->hasFile('image')) {
            if (! str_starts_with($path, 'http://') && ! str_starts_with($path, 'https://')) {
                Storage::disk('public')->delete($path);
            }
            $path = $request->file('image')->store('banners', 'public');
        }

        $banner->update([
            'badge' => $data['badge'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'cta_label' => $data['cta_label'],
            'category_id' => $data['category_id'] ?? null,
            'image_path' => $path,
            'sort_order' => $data['sort_order'],
            'is_active' => $data['is_active'],
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return redirect()->route('banners.index')->with('success', 'Banner berhasil diperbarui.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        $banner->update(['is_active' => false]);

        return redirect()->route('banners.index')->with('success', 'Banner dinonaktifkan.');
    }

    public function catalog(): JsonResponse
    {
        $banners = Banner::query()
            ->visible()
            ->with('category:id,slug')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Banner $banner) => [
                'uuid' => $banner->uuid,
                'badge' => $banner->badge,
                'title' => $banner->title,
                'description' => $banner->description,
                'cta_label' => $banner->cta_label,
                'category' => $banner->category?->slug,
                'image_url' => $banner->imageUrl(),
            ])
            ->values();

        return response()->json(['data' => $banners]);
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return ProductCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name'])
            ->map(fn (ProductCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }
}
