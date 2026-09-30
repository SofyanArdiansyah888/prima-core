import React from 'react';

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/45 ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-3">
      <div className="flex gap-3 items-center">
        <Skeleton className="size-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-14 rounded-md" />
          </div>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-3.5 pb-20">
      {/* Hero Image Skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* Main Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      </div>

      {/* Recommended For Skeleton */}
      <Skeleton className="h-16 w-full rounded-2xl" />

      {/* Specs Grid Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>

      {/* Stepper Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 pb-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-xs">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-5 w-40 pt-2" />
      </div>
    </div>
  );
}

export function TrackingSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-4 pt-3 border-t border-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="size-9 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3.5 p-4 flex-1">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-3.5 px-4 py-4 pb-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3.5 shadow-xs">
        <Skeleton className="size-14 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
