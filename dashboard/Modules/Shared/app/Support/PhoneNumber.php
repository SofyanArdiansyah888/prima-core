<?php

namespace Modules\Shared\Support;

final class PhoneNumber
{
    /**
     * Normalisasi nomor HP ke format lokal Indonesia: 08xxxxxxxxx.
     */
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

    /**
     * Alias untuk normalize: mengembalikan format lokal 08xxxxxxxxx.
     */
    public static function toLocal(string $phone): string
    {
        return self::normalize($phone);
    }

    /**
     * Normalisasi nomor HP ke format internasional: 628xxxxxxxxx.
     */
    public static function toInternational(string $phone): string
    {
        $local = self::normalize($phone);
        if ($local === '') {
            return '';
        }

        if (str_starts_with($local, '0')) {
            return '62'.substr($local, 1);
        }

        return $local;
    }

    /**
     * Mask nomor HP untuk privasi log/tampilan (misal: 0812****7890).
     */
    public static function mask(string $phone): string
    {
        $normalized = self::normalize($phone);
        $length = strlen($normalized);

        if ($length <= 6) {
            return $normalized;
        }

        $prefix = substr($normalized, 0, 4);
        $suffix = substr($normalized, -4);

        return $prefix.'****'.$suffix;
    }

    /**
     * Validasi nomor seluler Indonesia (08xx dengan total 10-14 digit).
     */
    public static function isMobile(string $phone): bool
    {
        $normalized = self::normalize($phone);

        return preg_match('/^08\d{8,12}$/', $normalized) === 1;
    }
}
