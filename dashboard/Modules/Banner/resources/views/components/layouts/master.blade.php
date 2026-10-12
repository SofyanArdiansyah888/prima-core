<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <title>Banner Module - {{ config('app.name', 'Laravel') }}</title>
    </head>
    <body>
        {{ $slot }}
    </body>
</html>
