<?php

namespace App\Support;

/**
 * Logo perusahaan untuk dokumen cetak (PDF DomPDF).
 * Di-embed sebagai data URI agar tidak bergantung pada akses file/URL saat render.
 */
final class PrintLogo
{
    private static ?string $cached = null;

    public static function dataUri(): string
    {
        if (self::$cached !== null) {
            return self::$cached;
        }

        $path = public_path('logo-pkm-print.png');
        if (! is_file($path)) {
            $path = public_path('logo-pkm.png');
        }

        return self::$cached = is_file($path)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($path))
            : '';
    }
}
