import { useState, type ImgHTMLAttributes } from 'react';

export interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  type?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src || src === '/favicon.png' || src === '/logo-pkm.png') {
    return (
      <div 
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/90 text-slate-500 select-none overflow-hidden p-2.5 ${className}`}
        aria-label={alt || 'PT Semen Tonasa - PKM'}
      >
        {/* Subtle decorative concentric rings background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
          <div className="size-48 rounded-full border border-slate-900" />
          <div className="absolute size-32 rounded-full border border-slate-900" />
          <div className="absolute size-16 rounded-full border border-slate-900" />
        </div>

        {/* Central Logo & Brand Card */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-full">
          <div className="relative flex items-center justify-center rounded-2xl bg-white p-2 shadow-xs ring-1 ring-slate-200/80">
            <img
              src="/favicon.png"
              alt="PT Prima Karya Manunggal"
              className="size-10 sm:size-12 max-w-full max-h-full object-contain drop-shadow-xs"
            />
          </div>
          <span className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 line-clamp-1 font-mono">
            SEMEN TONASA
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 tracking-wider line-clamp-1">
            PT PRIMA KARYA MANUNGGAL
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Material Tonasa'}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
}
