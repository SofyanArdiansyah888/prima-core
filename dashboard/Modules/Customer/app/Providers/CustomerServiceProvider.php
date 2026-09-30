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
}
