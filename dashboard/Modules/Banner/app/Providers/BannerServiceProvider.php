<?php

namespace Modules\Banner\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class BannerServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Banner';

    protected string $nameLower = 'banner';

    /**
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
