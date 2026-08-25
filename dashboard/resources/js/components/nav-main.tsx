import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Menu Utama
            </SidebarGroupLabel>
            <SidebarMenu className="mt-1 space-y-1">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`relative h-9.5 rounded-lg px-3 transition-all duration-150 ${
                                    active
                                        ? 'bg-emerald-500/10 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                                }`}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-2.5">
                                    {active && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                                    )}
                                    {item.icon && (
                                        <item.icon
                                            className={`size-4 shrink-0 transition-colors ${
                                                active
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'
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


