<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | API pelanggan dipakai aplikasi Ionic (dev: http://localhost:8100,
    | http://localhost:5173, Capacitor ionic://localhost). Origin * mencakup
    | origin dev itu tanpa mengunci IP LAN saat uji di perangkat.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
