<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Order\Models\Order;

class AutoCompleteOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:auto-complete {--dry-run : Hanya tampilkan pesanan yang memenuhi syarat tanpa menyimpan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Otomatis menyelesaikan pesanan (COMPLETED) jika seluruh ritase telah terkirim dan lewat 2x24 jam (48 jam) tanpa konfirmasi pelanggan';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memeriksa pesanan yang siap diselesaikan otomatis (tenggat 2x24 jam)...');

        $cutoff = now()->subHours(48);

        $orders = Order::query()
            ->where('status', 'ON_DELIVERY')
            ->whereNotNull('delivered_at')
            ->where('delivered_at', '<=', $cutoff)
            ->with('items')
            ->get();

        $completedCount = 0;

        foreach ($orders as $order) {
            $allFulfilled = $order->items->every(fn ($item) => (float) $item->fulfilled_quantity >= (float) $item->quantity);

            if (! $allFulfilled) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("[DRY-RUN] Order {$order->code} (Delivered: {$order->delivered_at}) akan diselesaikan otomatis.");
                $completedCount++;
                continue;
            }

            $order->update([
                'status' => 'COMPLETED',
                'customer_confirmed_at' => now(),
                'completed_by' => 'SYSTEM_TIMEOUT',
            ]);

            $this->info("Order {$order->code} berhasil diselesaikan otomatis oleh sistem (timeout 48 jam).");
            $completedCount++;
        }

        $this->info("Selesai. Total {$completedCount} pesanan diproses.");

        return 0;
    }
}
