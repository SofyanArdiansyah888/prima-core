<?php

namespace Modules\ProductCategory\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class ProductCategoryServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'ProductCategory';

    protected string $nameLower = 'productcategory';

    /**
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
