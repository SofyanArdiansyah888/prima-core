<?php

namespace Modules\Shared\Services\Whatsapp;

use Illuminate\Support\Facades\Log;
use Modules\Shared\Contracts\WhatsappGatewayInterface;
use Modules\Shared\Support\PhoneNumber;

class LogGateway implements WhatsappGatewayInterface
{
    /**
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}
     */
    public function sendNow(string $phone, string $message): array
    {
        $target = PhoneNumber::toLocal($phone);
        $masked = PhoneNumber::mask($phone);

        Log::info("[WhatsApp Simulator] Kirim ke {$masked} ({$target})", [
            'recipient' => $target,
            'message' => $message,
        ]);

        return [
            'success' => true,
            'id' => 'sim-'.uniqid(),
            'detail' => 'Simulated WhatsApp message logged successfully.',
            'raw' => [
                'status' => true,
                'target' => $target,
                'message' => $message,
            ],
        ];
    }
}
