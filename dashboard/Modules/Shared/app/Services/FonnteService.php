<?php

namespace Modules\Shared\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Shared\Jobs\SendWhatsappMessage;
use RuntimeException;
use Throwable;

class FonnteService
{
    public function send(string $phone, string $message): void
    {
        $phone = trim($phone);
        if ($phone === '' || trim($message) === '') {
            return;
        }

        try {
            SendWhatsappMessage::dispatch($phone, $message)->afterCommit();
        } catch (Throwable $exception) {
            Log::error('Gagal mengantri pesan WhatsApp.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function deliver(string $phone, string $message): void
    {
        try {
            $this->sendNow($phone, $message);
        } catch (Throwable $exception) {
            Log::error('Pengiriman Fonnte gagal.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function sendNow(string $phone, string $message): void
    {
        $token = config('services.fonnte.token');
        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Token Fonnte kosong.');
        }

        $target = $this->target($phone);
        if ($target === '') {
            throw new RuntimeException('Nomor WhatsApp kosong.');
        }

        $response = Http::withHeaders([
            'Authorization' => $token,
        ])->timeout(20)->asForm()->post('https://api.fonnte.com/send', [
            'target' => $target,
            'message' => $message,
            'countryCode' => '62',
        ]);

        if (! $response->successful() || $response->json('status') === false) {
            throw new RuntimeException('Fonnte menolak pengiriman: '.$response->status().' '.$response->body());
        }
    }

    private function target(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';
        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        return $digits;
    }
}
