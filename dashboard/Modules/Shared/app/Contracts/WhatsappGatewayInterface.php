<?php

namespace Modules\Shared\Contracts;

interface WhatsappGatewayInterface
{
    /**
     * Kirim pesan WhatsApp secara sinkron ke penyedia gateway.
     *
     * @return array{success: bool, id: ?string, detail: ?string, raw?: mixed}
     *
     * @throws \Throwable Jika pengiriman gagal atau ditolak oleh gateway
     */
    public function sendNow(string $phone, string $message): array;
}
