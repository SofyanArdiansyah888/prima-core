<?php

namespace Modules\Shared\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Shared\Jobs\SendWhatsappMessage;
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
        $token = config('services.fonnte.token');
        if (! is_string($token) || $token === '') {
            Log::warning('Token Fonnte kosong. Pesan WhatsApp tidak dikirim.');

            return;
        }

        $target = $this->target($phone);
        if ($target === '') {
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->timeout(20)->asForm()->post('https://api.fonnte.com/send', [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62',
            ]);

            if (! $response->successful()) {
                Log::warning('Fonnte menolak pengiriman.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (Throwable $exception) {
            Log::error('Pengiriman Fonnte gagal.', [
                'error' => $exception->getMessage(),
            ]);
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
