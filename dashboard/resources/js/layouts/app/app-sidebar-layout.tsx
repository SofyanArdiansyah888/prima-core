import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import type { Auth } from '@/types/auth';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    // Akun tanpa akses penuh dan belum ditautkan ke batching plant mana pun
    const noPlant = Array.isArray(auth?.plants) && auth.plants.length === 0;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {noPlant && (
                    <div className="mx-4 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800 md:mx-6 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        Akun Anda belum ditautkan ke batching plant mana pun, sehingga data transaksi tidak ditampilkan. Hubungi admin untuk
                        menambahkan plant di Master Users.
                    </div>
                )}
                {children}
            </AppContent>
        </AppShell>
    );
}
