<?php

namespace Modules\Shared\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Modules\Shared\Support\PhoneNumber;
use Throwable;

class CheckFonnteCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fonnte:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa status konektivitas, kuota, dan perangkat Fonnte WhatsApp Gateway';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $driver = config('services.fonnte.driver');
        $token = config('services.fonnte.token');

        if (! is_string($driver) || $driver === '') {
            $driver = (is_string($token) && trim($token) !== '') ? 'fonnte' : 'log';
        }

        $this->info("Current WhatsApp Driver: [{$driver}]");

        if ($driver === 'log') {
            $this->comment('WhatsApp gateway sedang berjalan pada mode SIMULASI (LOG).');
            $this->line('Setiap pesan akan dicatat ke storage/logs/laravel.log tanpa mengirim HTTP ke Fonnte.');

            return self::SUCCESS;
        }

        if ($driver === 'null') {
            $this->comment('WhatsApp gateway sedang berjalan pada mode NULL (no-op).');

            return self::SUCCESS;
        }

        if (! is_string($token) || trim($token) === '') {
            $this->error('FONNTE_TOKEN belum diatur di file .env.');

            return self::FAILURE;
        }

        $this->line('Menghubungi server Fonnte (https://api.fonnte.com/device)...');

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->timeout(10)->post('https://api.fonnte.com/device');

            if (! $response->successful()) {
                $this->error("HTTP Request gagal dengan status: {$response->status()}");
                $this->line($response->body());

                return self::FAILURE;
            }

            $data = $response->json();

            if (isset($data['status']) && $data['status'] === false) {
                $reason = $data['reason'] ?? 'Token tidak valid atau device belum terdaftar.';
                $this->error("Fonnte Error: {$reason}");

                return self::FAILURE;
            }

            $deviceStatus = (string) ($data['device_status'] ?? 'unknown');
            $statusLabel = $deviceStatus === 'connect'
                ? '<info>CONNECTED (Online)</info>'
                : '<error>DISCONNECTED (Offline)</error>';

            $deviceNumber = isset($data['device']) ? PhoneNumber::mask((string) $data['device']) : '-';

            $this->newLine();
            $this->info('Informasi Perangkat Fonnte:');
            $this->table(
                ['Parameter', 'Nilai'],
                [
                    ['Device Name', $data['name'] ?? '-'],
                    ['WhatsApp Number', $deviceNumber],
                    ['Device Status', $statusLabel],
                    ['Package', $data['package'] ?? '-'],
                    ['Remaining Quota', $data['quota'] ?? '-'],
                    ['Expired Date', $data['expired'] ?? '-'],
                    ['Total Messages Sent', $data['messages'] ?? '-'],
                ]
            );

            if ($deviceStatus !== 'connect') {
                $this->warn('PERINGATAN: Perangkat WhatsApp Anda sedang offline/terputus di Fonnte. Segera scan ulang QR di dashboard Fonnte.');
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('Gagal terhubung ke Fonnte: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
