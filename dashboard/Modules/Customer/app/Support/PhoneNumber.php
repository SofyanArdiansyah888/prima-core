<?php

namespace Modules\Customer\Support;

final class PhoneNumber
{
    public static function normalize(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '62')) {
            return '0'.substr($digits, 2);
        }

        if ($digits !== '' && ! str_starts_with($digits, '0')) {
            return '0'.$digits;
        }

        return $digits;
    }

    public static function isMobile(string $phone): bool
    {
        return preg_match('/^08\d{8,12}$/', $phone) === 1;
    }
}
