<?php

namespace Modules\Customer\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class CustomerServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Customer';

    protected string $nameLower = 'customer';

    /**
     * @var string[]
     */
    protected array $providers = [
        RouteServiceProvider::class,
    ];

    /**
     * Register views only if directory exists.
     */
    protected function registerViews(): void
    {
        $sourcePath = module_path($this->name, config('modules.paths.generator.views.path'));

        if (is_dir($sourcePath)) {
            parent::registerViews();
        }
    }
}
