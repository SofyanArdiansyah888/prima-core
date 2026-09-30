import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonRefresher, IonRefresherContent, type RefresherEventDetail } from '@ionic/react';
import { addOutline, cartOutline, chevronBackOutline, chevronDownCircleOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import type { StatusTone } from '../../domain/rules';
import PkmLogo from './PkmLogo';

export const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0c1d37] focus:ring-2 focus:ring-[#0c1d37]/15 transition-all outline-none';

const toneClass: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger: 'bg-red-50 text-[#d91424] border border-red-200',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200',
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="block text-[10px] font-extrabold tracking-wider text-[#ea580c] uppercase">{children}</span>;
}

export function PageIntro({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="mb-5">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="mt-1 text-xl font-extrabold text-[#0c1d37]">{title}</h1>
      {text ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#0c1d37]">
        <span>{label}</span>
        {hint ? <span className="text-[10px] font-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} resize-none ${className}`} {...props} />;
}

export function IconField({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="relative">
      <IonIcon icon={icon} className="pointer-events-none absolute top-3 left-3 text-base text-slate-400" />
      <div className="[&_input]:pl-9">{children}</div>
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1d37] via-[#162e55] to-[#0c1d37] hover:from-[#091528] hover:to-[#091528] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0c1d37]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuietButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#d91424] leading-relaxed">
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs ${className}`}>{children}</div>;
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${toneClass[tone]}`}>{children}</span>;
}

export function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rounded-lg py-2 transition-all font-bold cursor-pointer ${
            value === option.value ? 'bg-white text-[#0c1d37] shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  label,
  onDecrease,
  onIncrease,
  decreaseDisabled,
}: {
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
      <button type="button" className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-30 cursor-pointer" disabled={decreaseDisabled} onClick={onDecrease} aria-label="Kurangi">
        <IonIcon icon={removeOutline} className="text-xs" />
      </button>
      <span className="min-w-8 text-center font-mono text-xs font-bold text-slate-800">{label}</span>
      <button type="button" className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 cursor-pointer" onClick={onIncrease} aria-label="Tambah">
        <IonIcon icon={addOutline} className="text-xs" />
      </button>
    </div>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="p-1.5 text-slate-400 hover:text-[#d91424] transition-colors cursor-pointer" onClick={onClick} aria-label="Hapus">
      <IonIcon icon={trashOutline} className="text-base" />
    </button>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  return <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg">{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
      <span>{children}</span>
    </div>
  );
}

export function CartButton({ count }: { count: number }) {
  return (
    <Link to="/cart" className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#0c1d37] hover:bg-slate-100 transition-colors" aria-label="Keranjang">
      <IonIcon icon={cartOutline} className="text-xl" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#d91424] px-1 text-[10px] font-extrabold text-white shadow-xs">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function HeaderShell({ children }: { children: ReactNode }) {
  return (
    <IonHeader className="ion-no-border">
      {/* Top Decorative PKM Brand Strip */}
      <div className="flex h-1.5 w-full shrink-0">
        <div className="h-full w-1/3 bg-[#d91424]" />
        <div className="h-full w-1/3 bg-[#ea580c]" />
        <div className="h-full w-1/3 bg-[#0c1d37]" />
      </div>
      <div className="border-b border-slate-200 bg-white px-4 py-3">{children}</div>
    </IonHeader>
  );
}

export function BrandBar({
  title,
  cartCount,
  extra,
}: {
  title: string;
  cartCount?: number;
  extra?: ReactNode;
}) {
  return (
    <HeaderShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PkmLogo className="size-8 drop-shadow-xs" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold tracking-wide text-[#0c1d37]">PKM TONASA</span>
              <span className="rounded bg-[#d91424]/10 px-1 py-0.2 text-[8px] font-extrabold text-[#d91424] uppercase">Resmi</span>
            </div>
            <h1 className="text-sm font-bold text-slate-800">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cartCount !== undefined ? <CartButton count={cartCount} /> : null}
        </div>
      </div>
      {extra ? <div className="mt-3">{extra}</div> : null}
    </HeaderShell>
  );
}

export function NavBar({
  title,
  backHref,
  end,
}: {
  title: string;
  backHref: string;
  end?: ReactNode;
}) {
  return (
    <HeaderShell>
      <div className="flex items-center justify-between">
        <Link to={backHref} className="flex items-center gap-1.5 text-slate-700 hover:text-[#0c1d37] transition-colors font-bold text-sm">
          <IonIcon icon={chevronBackOutline} className="text-lg" />
          <span>{title}</span>
        </Link>
        <div className="flex items-center gap-2">
          {end}
        </div>
      </div>
    </HeaderShell>
  );
}

export function Screen({
  header,
  children,
  footer,
  onRefresh,
}: {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onRefresh?: (event: CustomEvent<RefresherEventDetail>) => void | Promise<void>;
}) {
  return (
    <IonPage>
      {header}
      <IonContent className="pkm-screen [--background:var(--pkm-canvas)]">
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
            <IonRefresherContent
              pullingIcon={chevronDownCircleOutline}
              pullingText="Tarik untuk memuat ulang"
              refreshingSpinner="crescent"
              refreshingText="Memperbarui data..."
            />
          </IonRefresher>
        )}
        <div className="flex min-h-full flex-1 flex-col bg-canvas text-ink">{children}</div>
      </IonContent>
      {footer}
    </IonPage>
  );
}

export function CategoryModal({
  categoryLabel,
  onReplace,
  onClose,
}: {
  categoryLabel: string;
  onReplace: () => void;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-xs rounded-card border border-line bg-surface p-5 text-center">
        <h2 className="font-display text-base font-bold text-ink">Kategori tidak boleh dicampur</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Keranjang saat ini berisi <span className="font-semibold text-brand">{categoryLabel}</span>. Satu pesanan hanya boleh satu kategori produk.
        </p>
        <div className="mt-4 space-y-2">
          <PrimaryButton type="button" onClick={onReplace}>Kosongkan keranjang dan tambah ini</PrimaryButton>
          <QuietButton type="button" onClick={onClose}>Batal</QuietButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
