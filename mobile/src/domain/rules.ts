import type { ProductCategory } from './types';

export function categoryConflict(current: ProductCategory | null, next: ProductCategory): boolean {
  return current !== null && current !== next;
}

export function quantityAfterStep(quantity: number, delta: number, minOrder: number): number {
  const next = quantity + delta;
  return next < minOrder ? quantity : next;
}

export function categoryLabel(category: string): string {
  return category === 'cement' ? 'Semen' : 'Ready Mix';
}

export function segmentLabel(category: ProductCategory): string {
  return category === 'cement' ? 'Semen (Sak)' : 'Ready Mix (m³)';
}

export type StatusTone = 'success' | 'danger' | 'warning';

export function orderStatusTone(status: string): StatusTone {
  if (status === 'COMPLETED') {
    return 'success';
  }

  if (status === 'CANCELLED') {
    return 'danger';
  }

  return 'warning';
}

export function paymentStatusLabel(status: string): string {
  return status === 'PENDING' ? 'Menunggu' : status;
}
