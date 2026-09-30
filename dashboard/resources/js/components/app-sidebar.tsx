import { Link } from '@inertiajs/react';
import {
    Building2,
    Factory,
    LayoutGrid,
    Users,
    Package,
    Route,
    ShoppingCart,
    FileSpreadsheet,
    Truck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const overviewItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const operationsNavItems: NavItem[] = [
    {
        title: 'Pesanan Pelanggan',
        href: '/sales/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Work Orders (SPK)',
        href: '/production/work-orders',
        icon: FileSpreadsheet,
    },
    {
        title: 'Surat Jalan & Pengantaran',
        href: '/dispatch/surat-jalan',
        icon: Truck,
    },
];

const masterNavItems: NavItem[] = [
    {
        title: 'Cabang',
        href: '/master/branches',
        icon: Building2,
    },
    {
        title: 'Batching Plants',
        href: '/master/batching-plants',
        icon: Factory,
    },
    {
        title: 'Master Produk',
        href: '/master/products',
        icon: Package,
    },
    {
        title: 'Tarif Pengantaran',
        href: '/master/delivery-rates',
        icon: Route,
    },
    {
        title: 'Users',
        href: '/master/users',
        icon: Users,
    },
];

function NavSection({ label, items }: { label?: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-1.5">
            {label && (
                <SidebarGroupLabel className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="space-y-0.5">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`relative h-9 rounded-xl px-3 transition-all duration-150 ${
                                    active
                                        ? 'bg-white/10 font-bold text-white shadow-xs'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-2.5">
                                    {active && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#ea580c]" />
                                    )}
                                    {item.icon && (
                                        <item.icon
                                            className={`size-4 shrink-0 transition-colors ${
                                                active
                                                    ? 'text-[#ea580c]'
                                                    : 'text-slate-400 group-hover:text-slate-200'
                                            }`}
                                        />
                                    )}
                                    <span className="text-sm">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-[#0c1d37] text-white">
            {/* Top PKM Brand Color Strip */}
            <div className="flex h-1.5 w-full shrink-0">
                <div className="h-full w-1/3 bg-[#d91424]" />
                <div className="h-full w-1/3 bg-[#ea580c]" />
                <div className="h-full w-1/3 bg-[#0c1d37]" />
            </div>

            <SidebarHeader className="border-b border-white/10 pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-white/5">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-1 py-2">
                <NavSection items={overviewItems} />
                <NavSection label="Operasional & Distribusi" items={operationsNavItems} />
                <NavSection label="Master Data" items={masterNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 pt-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

