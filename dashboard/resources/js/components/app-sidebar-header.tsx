import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md transition-[width,height] ease-linear md:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
                <div className="h-4 w-px bg-border" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:text-emerald-300">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    </span>
                    <span>PKM Online</span>
                </div>
            </div>
        </header>
    );
}


