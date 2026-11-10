import { router } from '@inertiajs/react';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export function ToggleCustomerModal({
    customer,
    onClose,
}: {
    customer: { uuid: string; name: string; is_active: boolean } | null;
    onClose: () => void;
}) {
    const deactivating = customer?.is_active ?? false;

    return (
        <ConfirmModal
            open={Boolean(customer)}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
            title={deactivating ? 'Nonaktifkan Pelanggan' : 'Aktifkan Pelanggan'}
            description={
                deactivating
                    ? `Akun "${customer?.name}" tidak akan bisa login ke aplikasi mobile dan sesi yang sedang aktif akan dikeluarkan. Riwayat pesanan tetap tersimpan.`
                    : `Akun "${customer?.name}" akan bisa login dan memesan kembali dari aplikasi mobile.`
            }
            variant={deactivating ? 'destructive' : 'emerald'}
            confirmText={deactivating ? 'Nonaktifkan' : 'Aktifkan'}
            cancelText="Batal"
            onConfirm={() => {
                if (customer) {
                    router.patch(
                        `/sales/customers/${customer.uuid}/toggle-active`,
                        {},
                        { preserveScroll: true, onFinish: onClose },
                    );
                }
            }}
        />
    );
}
