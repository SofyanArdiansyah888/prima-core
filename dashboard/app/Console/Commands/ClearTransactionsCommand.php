<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearTransactionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:clear-transactions {--force : Force the operation without confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all non-master transaction data (orders, work orders, dispatches, OTPs, and reset document sequences)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('PERINGATAN: Perintah ini akan menghapus seluruh data transaksi (Order, Work Order, Surat Jalan, OTP). Data Master TIDAK akan dihapus. Lanjutkan?')) {
            $this->info('Operasi dibatalkan.');

            return 0;
        }

        $this->info('Membersihkan data transaksi non-master...');

        $tables = [
            'surat_jalan_items',
            'surat_jalans',
            'work_orders',
            'order_items',
            'orders',
            'customer_otps',
        ];

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('TRUNCATE TABLE ' . implode(', ', $tables) . ' RESTART IDENTITY CASCADE;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->truncate();
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        // Reset nomor dokumen untuk entitas transaksi
        $deletedSequences = DB::table('document_sequences')
            ->whereIn('entity', ['order', 'work_order', 'surat_jalan'])
            ->delete();

        $this->info('✓ Seluruh data transaksi (Order, SPK, Surat Jalan, Item, OTP) berhasil dibersihkan.');
        $this->info("✓ Urutan penomoran dokumen transaksi ({$deletedSequences} entitas) berhasil di-reset.");
        $this->info('✓ Data Master (Cabang, Plant, User, Produk, Kategori, Tarif, Banner, Customer) tetap terjaga aman.');

        return 0;
    }
}
