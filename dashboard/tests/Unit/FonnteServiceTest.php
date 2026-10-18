<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\Http;
use Modules\Shared\Jobs\SendWhatsappMessage;
use Modules\Shared\Services\FonnteService;
use Modules\Shared\Services\Whatsapp\FonnteGateway;
use Modules\Shared\Services\Whatsapp\LogGateway;
use Modules\Shared\Services\Whatsapp\NullGateway;
use RuntimeException;
use Tests\TestCase;

class FonnteServiceTest extends TestCase
{
    public function test_resolves_log_gateway_when_configured(): void
    {
        config(['services.fonnte.driver' => 'log']);
        $service = new FonnteService;

        $this->assertInstanceOf(LogGateway::class, $service->getGateway());
    }

    public function test_resolves_null_gateway_when_configured(): void
    {
        config(['services.fonnte.driver' => 'null']);
        $service = new FonnteService;

        $this->assertInstanceOf(NullGateway::class, $service->getGateway());
    }

    public function test_resolves_fonnte_gateway_when_token_is_present(): void
    {
        config([
            'services.fonnte.driver' => 'fonnte',
            'services.fonnte.token' => 'sample-test-token',
        ]);
        $service = new FonnteService;

        $this->assertInstanceOf(FonnteGateway::class, $service->getGateway());
    }

    public function test_log_gateway_returns_simulated_success(): void
    {
        $service = new FonnteService(new LogGateway);
        $result = $service->sendNow('081234567890', 'Pesan uji coba');

        $this->assertTrue($result['success']);
        $this->assertStringStartsWith('sim-', (string) $result['id']);
    }

    public function test_null_gateway_returns_ignored_success(): void
    {
        $service = new FonnteService(new NullGateway);
        $result = $service->sendNow('081234567890', 'Pesan uji coba');

        $this->assertTrue($result['success']);
        $this->assertStringStartsWith('null-', (string) $result['id']);
    }

    public function test_fonnte_gateway_throws_when_token_is_missing(): void
    {
        $gateway = new FonnteGateway(token: '');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Token Fonnte kosong.');

        $gateway->sendNow('081234567890', 'Halo');
    }

    public function test_fonnte_gateway_success_with_http_fake(): void
    {
        Http::fake([
            'https://api.fonnte.com/send' => Http::response([
                'status' => true,
                'id' => ['88991122'],
                'detail' => 'success! message in queue',
                'target' => ['6281234567890'],
            ], 200),
        ]);

        $gateway = new FonnteGateway(token: 'valid-token', timeout: 5);
        $result = $gateway->sendNow('081234567890', 'Halo Tonasa');

        $this->assertTrue($result['success']);
        $this->assertSame('88991122', $result['id']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.fonnte.com/send'
                && $request['target'] === '6281234567890'
                && $request['message'] === 'Halo Tonasa'
                && $request->hasHeader('Authorization', 'valid-token');
        });
    }

    public function test_fonnte_gateway_throws_when_rejected_by_fonnte(): void
    {
        Http::fake([
            'https://api.fonnte.com/send' => Http::response([
                'status' => false,
                'reason' => 'device disconnected',
            ], 200),
        ]);

        $gateway = new FonnteGateway(token: 'valid-token');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Fonnte menolak pengiriman: device disconnected');

        $gateway->sendNow('081234567890', 'Halo Tonasa');
    }

    public function test_send_whatsapp_message_job_configuration(): void
    {
        $job = new SendWhatsappMessage('081234567890', 'Pesan antrean');

        $this->assertSame(3, $job->tries);
        $this->assertSame([15, 60, 180], $job->backoff);
        $this->assertSame(30, $job->timeout);
    }
}
