<?php

namespace Modules\Shared\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Modules\Shared\Services\FonnteService;
use Modules\Shared\Support\PhoneNumber;
use Throwable;

class SendWhatsappMessage implements ShouldQueue
{
    use Queueable;

    /**
     * Jumlah percobaan maksimal jika terjadi kegagalan gateway.
     */
    public int $tries = 3;

    /**
     * Jeda waktu retry (dalam detik) secara bertingkat: 15 detik, 1 menit, 3 menit.
     *
     * @var array<int, int>
     */
    public array $backoff = [15, 60, 180];

    /**
     * Timeout eksekusi per job (detik).
     */
    public int $timeout = 30;

    public function __construct(
        public string $phone,
        public string $message,
    ) {}

    public function handle(FonnteService $fonnte): void
    {
        try {
            $fonnte->deliver($this->phone, $this->message);
        } catch (Throwable $exception) {
            Log::warning('Pengiriman notifikasi WhatsApp Fonnte gagal (non-blocking).', [
                'recipient' => PhoneNumber::mask($this->phone),
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Dipanggil ketika semua percobaan retry telah habis dan job dinyatakan gagal.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('Pengiriman pesan WhatsApp gagal setelah semua percobaan habis.', [
            'recipient' => PhoneNumber::mask($this->phone),
            'error' => $exception?->getMessage(),
        ]);
    }
}
