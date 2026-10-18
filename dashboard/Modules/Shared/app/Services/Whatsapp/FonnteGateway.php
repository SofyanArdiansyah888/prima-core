<?php

namespace Modules\Shared\Services\Whatsapp;

use Illuminate\Support\Facades\Http;
use Modules\Shared\Contracts\WhatsappGatewayInterface;
use Modules\Shared\Support\PhoneNumber;
use RuntimeException;

class FonnteGateway implements WhatsappGatewayInterface
{
    public function __construct(
        private ?string $token = null,
        private int $timeout = 10,
        private string $endpoint = 'https://api.fonnte.com/send',
    ) {
        $this->token = $this->token ?? config('services.fonnte.token');
        $this->timeout = $this->timeout ?: (int) config('services.fonnte.timeout', 10);
    }

    /**
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}
     */
    public function sendNow(string $phone, string $message): array
    {
        if (! is_string($this->token) || trim($this->token) === '') {
            throw new RuntimeException('Token Fonnte kosong.');
        }

        $target = PhoneNumber::toInternational($phone);
        if ($target === '') {
            throw new RuntimeException('Nomor WhatsApp kosong.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->token,
        ])->timeout($this->timeout)->asForm()->post($this->endpoint, [
            'target' => $target,
            'message' => $message,
            'countryCode' => '62',
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Fonnte HTTP error: '.$response->status().' '.$response->body());
        }

        $data = $response->json();
        if (isset($data['status']) && $data['status'] === false) {
            $reason = (string) ($data['reason'] ?? 'Permintaan ditolak oleh Fonnte.');
            throw new RuntimeException('Fonnte menolak pengiriman: '.$reason);
        }

        $id = null;
        if (isset($data['id']) && is_array($data['id']) && ! empty($data['id'])) {
            $id = (string) $data['id'][0];
        }

        return [
            'success' => true,
            'id' => $id,
            'detail' => (string) ($data['detail'] ?? 'success! message in queue'),
            'raw' => $data,
        ];
    }
}
