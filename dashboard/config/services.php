<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mobile_app' => [
        'url' => env('MOBILE_APP_URL', 'https://mobile-pkm.orcaid.cloud'),
    ],

    'fonnte' => [
        'driver' => env('FONNTE_DRIVER'),
        'token' => env('FONNTE_TOKEN'),
        'admin_phone' => env('FONNTE_ADMIN_PHONE'),
        'timeout' => (int) env('FONNTE_TIMEOUT', 10),
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY', 'SB-Mid-server-test'),
        'client_key' => env('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-test'),
        'merchant_id' => env('MIDTRANS_MERCHANT_ID', ''),
        'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
        // Biaya layanan flat untuk klien lama yang membayar tanpa memilih metode.
        'admin_fee' => (float) env('MIDTRANS_ADMIN_FEE', 4500),

        /*
         * Biaya layanan per metode pembayaran (dibebankan ke pelanggan).
         * percent = persen dari nominal, fixed = rupiah tetap. Sesuaikan dengan tarif kontrak Midtrans.
         * snap = kode enabled_payments Midtrans Snap. Atur metode aktif via MIDTRANS_CHANNELS (koma).
         */
        'enabled_channels' => array_values(array_filter(array_map('trim', explode(',', (string) env(
            'MIDTRANS_CHANNELS',
            'qris,gopay,shopeepay,bca_va,bni_va,bri_va,mandiri_va,permata_va,credit_card',
        ))))),
        'payment_channels' => [
            'qris' => ['label' => 'QRIS', 'group' => 'QRIS & E-Wallet', 'snap' => ['other_qris'], 'percent' => 0.7, 'fixed' => 0],
            'gopay' => ['label' => 'GoPay', 'group' => 'QRIS & E-Wallet', 'snap' => ['gopay'], 'percent' => 2.0, 'fixed' => 0],
            'shopeepay' => ['label' => 'ShopeePay', 'group' => 'QRIS & E-Wallet', 'snap' => ['shopeepay'], 'percent' => 2.0, 'fixed' => 0],
            'bca_va' => ['label' => 'BCA Virtual Account', 'group' => 'Virtual Account', 'snap' => ['bca_va'], 'percent' => 0, 'fixed' => 4000],
            'bni_va' => ['label' => 'BNI Virtual Account', 'group' => 'Virtual Account', 'snap' => ['bni_va'], 'percent' => 0, 'fixed' => 4000],
            'bri_va' => ['label' => 'BRI Virtual Account', 'group' => 'Virtual Account', 'snap' => ['bri_va'], 'percent' => 0, 'fixed' => 4000],
            'mandiri_va' => ['label' => 'Mandiri Bill Payment', 'group' => 'Virtual Account', 'snap' => ['echannel'], 'percent' => 0, 'fixed' => 4000],
            'permata_va' => ['label' => 'Permata Virtual Account', 'group' => 'Virtual Account', 'snap' => ['permata_va'], 'percent' => 0, 'fixed' => 4000],
            'credit_card' => ['label' => 'Kartu Kredit / Debit Online', 'group' => 'Kartu', 'snap' => ['credit_card'], 'percent' => 2.9, 'fixed' => 2000],
        ],
    ],

];
