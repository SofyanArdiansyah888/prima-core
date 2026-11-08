<?php

namespace Modules\Order\Observers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Order\Models\Order;
use Modules\Order\Services\OrderSalesContacts;
use Modules\Order\Support\OrderWhatsappMessages;
use Modules\Shared\Services\FonnteService;

class OrderObserver
{
    public function __construct(
        private FonnteService $fonnte,
        private OrderSalesContacts $salesContacts,
        private OrderWhatsappMessages $messages,
    ) {}

    /**
     * Notifikasi pesanan baru. Dijalankan setelah transaksi commit agar item pesanan sudah tersimpan.
     */
    public function created(Order $order): void
    {
        DB::afterCommit(function () use ($order): void {
            $order = $order->fresh(['items.product', 'batchingPlant']);
            if (! $order) {
                return;
            }

            $this->safely('pesanan baru (customer)', function () use ($order): void {
                $this->fonnte->send((string) $order->customer_phone, $this->messages->customerOrderCreated($order));
            });

            // Sales plant hanya perlu survei untuk pesanan dari aplikasi customer yang menunggu verifikasi.
            if ($order->status === 'PENDING_APPROVAL') {
                $this->safely('survei lokasi (sales)', function () use ($order): void {
                    foreach ($this->salesContacts->forOrder($order) as $contact) {
                        $this->fonnte->send($contact['whatsapp'], $this->messages->salesSurvey($order));
                    }
                });
            }

            $this->safely('pesanan baru (admin)', function () use ($order): void {
                $admin = config('services.fonnte.admin_phone');
                if (! is_string($admin) || trim($admin) === '') {
                    return;
                }
                $message = $this->messages->adminNewOrder($order);
                foreach (array_filter(array_map('trim', explode(',', $admin))) as $adminPhone) {
                    $this->fonnte->send($adminPhone, $message);
                }
            });
        });
    }

    public function updated(Order $order): void
    {
        $statusChanged = $order->wasChanged('status');
        $paymentChanged = $order->wasChanged('payment_status');

        if (! $statusChanged && ! $paymentChanged) {
            return;
        }

        $this->safely('perubahan pesanan (customer)', function () use ($order, $statusChanged, $paymentChanged): void {
            $phone = (string) $order->customer_phone;

            if ($statusChanged) {
                $this->fonnte->send($phone, $this->messages->customerStatusChanged($order));
            }

            if ($paymentChanged && $order->payment_status === 'PAID') {
                $this->fonnte->send($phone, $this->messages->customerPaymentReceived($order));
            }

            // Refund saat pembatalan sudah disebut di pesan "Pesanan Dibatalkan".
            if ($paymentChanged && $order->payment_status === 'REFUNDED' && ! $statusChanged) {
                $this->fonnte->send($phone, $this->messages->customerRefunded($order));
            }
        });
    }

    private function safely(string $context, callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $e) {
            Log::warning("Gagal mengantri notifikasi WhatsApp {$context}: ".$e->getMessage());
        }
    }
}
