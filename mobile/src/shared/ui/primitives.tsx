import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { IonContent, IonHeader, IonIcon, IonPage } from '@ionic/react';
import { addOutline, cartOutline, chevronBackOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import type { StatusTone } from '../../domain/rules';

export const inputClass = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-xs text-ink outline-none focus:border-brand';

const toneClass: Record<StatusTone, string> = {
  success: 'bg-brand-soft text-brand',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-amber-soft text-amber-ink',
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="block font-mono text-[10px] font-bold tracking-widest text-brand uppercase">{children}</span>;
}

export function PageIntro({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h1>
      {text ? <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted">
        {label}
        {hint ? <span className="font-normal text-subtle"> {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} bg-fill`} {...props} />;
}

export function IconField({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="relative">
      <IonIcon icon={icon} className="pointer-events-none absolute top-2.5 left-3 text-base text-subtle" />
      <div className="[&_input]:pl-9">{children}</div>
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-lg bg-brand px-4 py-3 text-xs font-semibold tracking-wide text-surface disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuietButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-lg bg-fill px-4 py-2.5 text-xs font-medium text-ink ${className}`}
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

  return <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{children}</p>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClass[tone]}`}>{children}</span>;
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
    <div className="grid grid-cols-2 rounded-lg border border-line bg-fill p-1 text-xs font-semibold">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rounded-md py-2 ${value === option.value ? 'bg-brand text-surface' : 'bg-transparent text-muted'}`}
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
    <div className="flex items-center gap-2 rounded-lg border border-line bg-fill p-1">
      <button type="button" className="rounded p-1 text-ink disabled:opacity-30" disabled={decreaseDisabled} onClick={onDecrease} aria-label="Kurangi">
        <IonIcon icon={removeOutline} />
      </button>
      <span className="px-1 font-mono text-xs font-bold text-ink">{label}</span>
      <button type="button" className="rounded p-1 text-ink" onClick={onIncrease} aria-label="Tambah">
        <IonIcon icon={addOutline} />
      </button>
    </div>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="p-1 text-subtle" onClick={onClick} aria-label="Hapus">
      <IonIcon icon={trashOutline} />
    </button>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  return <div className="border-t border-line bg-surface px-4 py-3">{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-card border border-amber-line bg-amber-soft p-3 text-[11px] text-amber-ink">
      <span>{children}</span>
    </div>
  );
}

export function CartButton({ count }: { count: number }) {
  return (
    <Link to="/cart" className="relative rounded-lg bg-fill p-2 text-ink" aria-label="Keranjang">
      <IonIcon icon={cartOutline} className="text-xl" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-surface">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function HeaderShell({ children }: { children: ReactNode }) {
  return (
    <IonHeader className="ion-no-border">
      <div className="border-b border-line bg-surface px-4 py-3">{children}</div>
    </IonHeader>
  );
}

export function BrandBar({ title, cartCount, extra }: { title: string; cartCount?: number; extra?: ReactNode }) {
  return (
    <HeaderShell>
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>PKM Tonasa</Eyebrow>
          <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        </div>
        {cartCount !== undefined ? <CartButton count={cartCount} /> : null}
      </div>
      {extra ? <div className="mt-3">{extra}</div> : null}
    </HeaderShell>
  );
}

export function NavBar({ title, backHref, end }: { title: string; backHref: string; end?: ReactNode }) {
  return (
    <HeaderShell>
      <div className="flex items-center justify-between">
        <Link to={backHref} className="flex items-center gap-1 text-ink">
          <IonIcon icon={chevronBackOutline} />
          <span className="font-display text-base font-bold">{title}</span>
        </Link>
        {end}
      </div>
    </HeaderShell>
  );
}

export function Screen({ header, children, footer }: { header?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <IonPage>
      {header}
      <IonContent className="pkm-screen [--background:var(--pkm-canvas)]">
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
