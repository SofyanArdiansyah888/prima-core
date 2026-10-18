<?php

namespace Modules\Customer\Support;

use Modules\Shared\Support\PhoneNumber as SharedPhoneNumber;

final class PhoneNumber
{
    public static function normalize(string $phone): string
    {
        return SharedPhoneNumber::normalize($phone);
    }

    public static function isMobile(string $phone): bool
    {
        return SharedPhoneNumber::isMobile($phone);
    }

    public static function mask(string $phone): string
    {
        return SharedPhoneNumber::mask($phone);
    }

    public static function toInternational(string $phone): string
    {
        return SharedPhoneNumber::toInternational($phone);
    }
}
