<?php

namespace Modules\Shared\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Shared\Services\FonnteService;

class SendWhatsappMessage implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $phone,
        public string $message,
    ) {}

    public function handle(FonnteService $fonnte): void
    {
        $fonnte->deliver($this->phone, $this->message);
    }
}
