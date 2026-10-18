<?php

namespace Modules\Shared\Services\Whatsapp;

use Modules\Shared\Contracts\WhatsappGatewayInterface;

class NullGateway implements WhatsappGatewayInterface
{
    /**
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}
     */
    public function sendNow(string $phone, string $message): array
    {
        return [
            'success' => true,
            'id' => 'null-'.uniqid(),
            'detail' => 'Message ignored (null driver).',
            'raw' => [],
        ];
    }
}
