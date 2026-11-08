import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';

/** Kerangka halaman daftar operasional: lebar & jarak seragam. */
export function ListPage({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
        </div>
    );
}

export function ListHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

export type ChipOption = { value: string; label: string; count?: number };

/** Filter status berbentuk chip dengan jumlah data per status. */
export function StatusChips({
    options,
    value,
    onChange,
    allLabel = 'Semua',
    allCount,
}: {
    options: ChipOption[];
    value: string;
    onChange: (value: string) => void;
    allLabel?: string;
    allCount?: number;
}) {
    const chip = (
        key: string,
        label: string,
        count: number | undefined,
        active: boolean,
    ) => (
        <button
            key={key || 'all'}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                    ? 'border-[#0c1d37] bg-[#0c1d37] text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
        >
            <span>{label}</span>
            {count !== undefined && (
                <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
                >
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="flex flex-wrap gap-1.5">
            {chip('', allLabel, allCount, value === '')}
            {options.map((o) =>
                chip(o.value, o.label, o.count, value === o.value),
            )}
        </div>
    );
}

/** Baris pencarian + filter tambahan (mis. plant). */
export function ListToolbar({
    search,
    onSearchChange,
    onSubmit,
    placeholder,
    children,
}: {
    search: string;
    onSearchChange: (v: string) => void;
    onSubmit: () => void;
    placeholder: string;
    children?: ReactNode;
}) {
    return (
        <form
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onSubmit();
            }}
            className="flex flex-wrap items-center gap-2"
        >
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-9 rounded-lg border-slate-200 bg-white pl-9 text-xs dark:border-slate-800 dark:bg-slate-900"
                />
            </div>
            {children}
        </form>
    );
}

export function FilterSelect({
    value,
    onChange,
    children,
}: {
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#0c1d37] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
            {children}
        </select>
    );
}

export function ListTable({
    head,
    children,
    footer,
}: {
    head: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        {head}
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {children}
                    </tbody>
                </table>
            </div>
            {footer}
        </div>
    );
}

export function Th({
    children,
    align = 'left',
    className = '',
}: {
    children?: ReactNode;
    align?: 'left' | 'right' | 'center';
    className?: string;
}) {
    const a =
        align === 'right'
            ? 'text-right'
            : align === 'center'
              ? 'text-center'
              : 'text-left';

    return <th className={`px-4 py-2.5 ${a} ${className}`}>{children}</th>;
}

export function Td({
    children,
    align = 'left',
    className = '',
}: {
    children?: ReactNode;
    align?: 'left' | 'right' | 'center';
    className?: string;
}) {
    const a =
        align === 'right'
            ? 'text-right'
            : align === 'center'
              ? 'text-center'
              : 'text-left';

    return (
        <td className={`px-4 py-3 align-middle ${a} ${className}`}>
            {children}
        </td>
    );
}

export function EmptyRow({
    colSpan,
    message,
}: {
    colSpan: number;
    message: string;
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-4 py-12 text-center text-xs text-slate-500"
            >
                {message}
            </td>
        </tr>
    );
}

export type Tone = 'slate' | 'blue' | 'amber' | 'purple' | 'emerald' | 'red';

const TONES: Record<Tone, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    emerald:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-50 text-[#d91424] dark:bg-red-900/30 dark:text-red-300',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONES[tone]}`}
        >
            {children}
        </span>
    );
}

/** Progres volume ringkas: "3 / 7 m³" + bar tipis. */
export function Progress({
    done,
    total,
    unit,
}: {
    done: number;
    total: number;
    unit: string;
}) {
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const fmt = (v: number) =>
        Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });

    return (
        <div className="min-w-[120px]">
            <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <span>
                    {fmt(done)} / {fmt(total)} {unit}
                </span>
                <span className="text-slate-400">{pct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-600' : 'bg-[#ea580c]'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export function Pagination({
    links,
    total,
    shown,
}: {
    links?: { url: string | null; label: string; active: boolean }[];
    total?: number;
    shown: number;
}) {
    if (!links || links.length <= 3) {
        return total !== undefined ? (
            <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-800">
                {total} data
            </div>
        ) : null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
                {shown} dari {total ?? shown} data
            </span>
            <div className="flex gap-1">
                {links.map((link, idx) =>
                    link.url ? (
                        <Link
                            key={idx}
                            href={link.url}
                            preserveScroll
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                link.active
                                    ? 'bg-[#0c1d37] text-white'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={idx}
                            className="px-2.5 py-1 text-xs text-slate-300"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
