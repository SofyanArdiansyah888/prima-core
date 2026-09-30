import { useState, type ImgHTMLAttributes } from 'react';

export interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  type?: 'cement' | 'readymix' | 'news' | 'general';
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt || 'Image'}
          className={className}
          onError={() => setHasError(true)}
          {...props}
        />
      );
    }

    // Black & White (Monochrome) Company Logo Placeholder - Soft Tone
    return (
      <div 
        className={`flex items-center justify-center bg-slate-50 text-slate-400 select-none overflow-hidden p-2 ${className}`}
        aria-label={alt || 'Logo PKM Tonasa'}
      >
        <img
          src="/logo-pkm-bw.svg"
          alt="PKM Tonasa"
          className="max-h-10 max-w-10 size-2/3 object-contain opacity-35 grayscale"
        />
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
