<?php

namespace Modules\Shared\Services;

use App\Models\User;
use Modules\Banner\Models\Banner;
use Modules\BatchingPlant\Models\BatchingPlant;
use Modules\Branch\Models\Branch;
use Modules\Dispatch\Models\SuratJalan;
use Modules\Dispatch\Models\SuratJalanItem;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Product\Models\Product;
use Modules\ProductCategory\Models\ProductCategory;
use Modules\WorkOrder\Models\WorkOrder;

class MasterDeletionGuard
{
    /**
     * Check if a Branch can be safely deleted.
     */
    public function checkBranch(Branch $branch): ?string
    {
        $plantIds = $branch->batchingPlants()->pluck('id');

        $ordersCount = Order::query()->whereIn('batching_plant_id', $plantIds)->count();
        $woCount = WorkOrder::query()->whereIn('batching_plant_id', $plantIds)->count();
        $sjCount = SuratJalan::query()->whereIn('batching_plant_id', $plantIds)->count();
        $totalTrx = $ordersCount + $woCount + $sjCount;

        if ($totalTrx > 0) {
            $details = [];
            if ($ordersCount) {
                $details[] = "{$ordersCount} pesanan";
            }
            if ($woCount) {
                $details[] = "{$woCount} SPK produksi";
            }
            if ($sjCount) {
                $details[] = "{$sjCount} surat jalan";
            }
            $detailStr = implode(', ', $details);

            return "Cabang '{$branch->name}' ({$branch->code}) tidak dapat dihapus karena telah terpakai dalam transaksi ({$detailStr}).";
        }

        $plantCount = $branch->batchingPlants()->count();
        if ($plantCount > 0) {
            return "Cabang '{$branch->name}' tidak dapat dihapus karena masih memiliki {$plantCount} batching plant terdaftar. Hapus batching plant terlebih dahulu.";
        }

        $userCount = $branch->users()->count();
        if ($userCount > 0) {
            return "Cabang '{$branch->name}' tidak dapat dihapus karena masih memiliki {$userCount} personil user terdaftar. Pindahkan atau hapus user terlebih dahulu.";
        }

        return null;
    }

    /**
     * Check if a Batching Plant can be safely deleted.
     */
    public function checkBatchingPlant(BatchingPlant $plant): ?string
    {
        $ordersCount = Order::query()->where('batching_plant_id', $plant->id)->count();
        $woCount = WorkOrder::query()->where('batching_plant_id', $plant->id)->count();
        $sjCount = SuratJalan::query()->where('batching_plant_id', $plant->id)->count();
        $totalTrx = $ordersCount + $woCount + $sjCount;

        if ($totalTrx > 0) {
            $details = [];
            if ($ordersCount) {
                $details[] = "{$ordersCount} pesanan";
            }
            if ($woCount) {
                $details[] = "{$woCount} SPK produksi";
            }
            if ($sjCount) {
                $details[] = "{$sjCount} surat jalan";
            }
            $detailStr = implode(', ', $details);

            return "Batching Plant '{$plant->name}' ({$plant->code}) tidak dapat dihapus karena telah terpakai dalam transaksi ({$detailStr}).";
        }

        return null;
    }

    /**
     * Check if a Product Category can be safely deleted.
     */
    public function checkProductCategory(ProductCategory $category): ?string
    {
        $productIds = $category->products()->pluck('id');

        $oiCount = OrderItem::query()->whereIn('product_id', $productIds)->count();
        $woCount = WorkOrder::query()->whereIn('product_id', $productIds)->count();
        $sjiCount = SuratJalanItem::query()->whereIn('product_id', $productIds)->count();
        $totalTrx = $oiCount + $woCount + $sjiCount;

        if ($totalTrx > 0) {
            $details = [];
            if ($oiCount) {
                $details[] = "{$oiCount} item pesanan";
            }
            if ($woCount) {
                $details[] = "{$woCount} SPK produksi";
            }
            if ($sjiCount) {
                $details[] = "{$sjiCount} surat jalan";
            }
            $detailStr = implode(', ', $details);

            return "Kategori '{$category->name}' ({$category->code}) tidak dapat dihapus karena produk di dalamnya telah terpakai dalam transaksi ({$detailStr}).";
        }

        $prodCount = $category->products()->count();
        if ($prodCount > 0) {
            return "Kategori '{$category->name}' tidak dapat dihapus karena masih memiliki {$prodCount} produk terdaftar. Hapus atau pindahkan produk di dalamnya terlebih dahulu.";
        }

        $bannerCount = Banner::query()->where('category_id', $category->id)->count();
        if ($bannerCount > 0) {
            return "Kategori '{$category->name}' tidak dapat dihapus karena masih terhubung dengan {$bannerCount} banner beranda.";
        }

        return null;
    }

    /**
     * Check if a Product can be safely deleted.
     */
    public function checkProduct(Product $product): ?string
    {
        $oiCount = OrderItem::query()->where('product_id', $product->id)->count();
        $woCount = WorkOrder::query()->where('product_id', $product->id)->count();
        $sjiCount = SuratJalanItem::query()->where('product_id', $product->id)->count();
        $totalTrx = $oiCount + $woCount + $sjiCount;

        if ($totalTrx > 0) {
            $details = [];
            if ($oiCount) {
                $details[] = "{$oiCount} item pesanan";
            }
            if ($woCount) {
                $details[] = "{$woCount} SPK produksi";
            }
            if ($sjiCount) {
                $details[] = "{$sjiCount} surat jalan";
            }
            $detailStr = implode(', ', $details);

            return "Produk '{$product->name}' ({$product->code}) tidak dapat dihapus karena telah terpakai dalam transaksi ({$detailStr}).";
        }

        return null;
    }

    /**
     * Check if a User can be safely deleted.
     */
    public function checkUser(User $user, int $currentUserId): ?string
    {
        if ($user->id === $currentUserId) {
            return 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.';
        }

        $woCount = WorkOrder::query()->where('assigned_user_id', $user->id)->count();
        if ($woCount > 0) {
            return "User '{$user->name}' ({$user->code}) tidak dapat dihapus karena telah terpakai dalam transaksi ({$woCount} SPK produksi yang ditugaskan).";
        }

        return null;
    }
}
