<?php

namespace Modules\Shared\Services;

use Illuminate\Support\Facades\Log;
use Modules\Shared\Contracts\WhatsappGatewayInterface;
use Modules\Shared\Jobs\SendWhatsappMessage;
use Modules\Shared\Services\Whatsapp\FonnteGateway;
use Modules\Shared\Services\Whatsapp\LogGateway;
use Modules\Shared\Services\Whatsapp\NullGateway;
use Modules\Shared\Support\PhoneNumber;
use Throwable;

class FonnteService
{
    private WhatsappGatewayInterface $gateway;

    public function __construct(?WhatsappGatewayInterface $gateway = null)
    {
        $this->gateway = $gateway ?? $this->resolveGateway();
    }

    /**
     * Mengantrikan pesan WhatsApp untuk dikirim secara asinkron setelah DB commit.
     */
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
                'recipient' => PhoneNumber::mask($phone),
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Pengiriman langsung yang dipanggil oleh Queue Worker (SendWhatsappMessage).
     * Akan melempar exception bila gagal agar mekanisme retry queue Laravel berjalan.
     *
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}
     */
    public function deliver(string $phone, string $message): array
    {
        return $this->sendNow($phone, $message);
    }

    /**
     * Kirim pesan WhatsApp secara sinkron.
     *
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}|mixed
     *
     * @throws Throwable Jika gateway gagal mengirim pesan
     */
    public function sendNow(string $phone, string $message): mixed
    {
        return $this->gateway->sendNow($phone, $message);
    }

    public function getGateway(): WhatsappGatewayInterface
    {
        return $this->gateway;
    }

    public function setGateway(WhatsappGatewayInterface $gateway): self
    {
        $this->gateway = $gateway;

        return $this;
    }

    private function resolveGateway(): WhatsappGatewayInterface
    {
        $driver = config('services.fonnte.driver');

        if (! is_string($driver) || $driver === '') {
            $token = config('services.fonnte.token');
            $driver = (is_string($token) && trim($token) !== '') ? 'fonnte' : 'log';
        }

        return match ($driver) {
            'log' => new LogGateway,
            'null' => new NullGateway,
            default => new FonnteGateway,
        };
    }
}
