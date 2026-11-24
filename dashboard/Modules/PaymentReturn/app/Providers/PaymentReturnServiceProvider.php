<?php

namespace Modules\PaymentReturn\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class PaymentReturnServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'PaymentReturn';

    protected string $nameLower = 'paymentreturn';

    /**
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
