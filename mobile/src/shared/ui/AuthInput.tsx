import React, { forwardRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { eyeOffOutline, eyeOutline, lockClosedOutline } from 'ionicons/icons';

export interface BaseInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  rightLabelAction?: React.ReactNode;
  icon?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

/**
 * Reusable Auth Input with pixel-perfect alignment, prefix/icon box, and zero border issues.
 */
export const AuthInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      label,
      hint,
      rightLabelAction,
      icon,
      prefix,
      suffix,
      error,
      id,
      className = '',
      containerClassName = '',
      style,
      ...inputProps
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label & Optional Right Action */}
        {(label || rightLabelAction) && (
          <div className="mb-1.5 flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="cursor-pointer text-xs font-bold text-[#0c1d37] select-none"
              >
                {label}
                {hint && <span className="ml-1 text-[10px] font-normal text-slate-400">{hint}</span>}
              </label>
            )}
            {rightLabelAction}
          </div>
        )}

        {/* Input Wrapper Container */}
        <div
          className={`group relative flex h-12 w-full items-stretch overflow-hidden rounded-xl border bg-white shadow-xs transition-all ${
            error
              ? 'border-red-400 focus-within:border-[#d91424] focus-within:ring-4 focus-within:ring-[#d91424]/10'
              : 'border-slate-300 focus-within:border-[#0c1d37] focus-within:ring-4 focus-within:ring-[#0c1d37]/10'
          }`}
        >
          {/* Prefix (e.g. +62) or Icon Box */}
          {prefix ? (
            <div className="flex h-full shrink-0 select-none items-center justify-center border-r border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-700">
              {prefix}
            </div>
          ) : icon ? (
            <div className="flex h-full w-11 shrink-0 select-none items-center justify-center border-r border-slate-200 bg-slate-50 text-base text-slate-500 group-focus-within:text-[#0c1d37]">
              <IonIcon icon={icon} />
            </div>
          ) : null}

          {/* Core Input Element */}
          <input
            ref={ref}
            id={inputId}
            className={`h-full flex-1 border-0 bg-transparent px-3.5 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-0 focus:outline-none focus:ring-0 ${
              suffix ? 'pr-12' : ''
            } ${className}`}
            style={{ border: 'none', outline: 'none', boxShadow: 'none', ...style }}
            {...inputProps}
          />

          {/* Suffix (e.g. toggle button or unit) */}
          {suffix && (
            <div className="absolute top-0 right-0 flex h-full items-center justify-center">
              {suffix}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="mt-1 text-[11px] font-medium text-[#d91424]">{error}</p>}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export interface PhoneInputProps extends Omit<BaseInputProps, 'prefix'> {
  prefixText?: string;
}

/**
 * Reusable Indonesian Phone Input (+62 prefix)
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ prefixText = '+62', ...props }, ref) => {
    return (
      <AuthInput
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="812 3456 7890"
        prefix={<span>{prefixText}</span>}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export interface PasswordInputProps extends Omit<BaseInputProps, 'type' | 'suffix'> {
  showToggle?: boolean;
}

/**
 * Reusable Password Input with built-in toggle visibility button and lock icon
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, icon = lockClosedOutline, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <AuthInput
        ref={ref}
        type={visible ? 'text' : 'password'}
        icon={icon}
        suffix={
          showToggle ? (
            <button
              type="button"
              onClick={() => setVisible((prev) => !prev)}
              className="flex h-full w-11 items-center justify-center border-0 bg-transparent text-slate-400 transition-colors hover:text-slate-700 active:bg-slate-100 outline-none cursor-pointer"
              aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              <IonIcon icon={visible ? eyeOffOutline : eyeOutline} className="text-xl" />
            </button>
          ) : null
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
