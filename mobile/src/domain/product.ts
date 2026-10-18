import type { Product } from './types';

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'https://pkm.orcaid.cloud';
export const API_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Memastikan URL aset storage mengarah ke domain backend produksi
 * jika backend secara tidak sengaja mengembalikan URL localhost.
 */
export function resolveStorageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_URL);
  }
  return url;
}

/**
 * Mengambil URL gambar produk yang diunggah dari backend dashboard.
 * Jika belum diunggah, mengembalikan string kosong agar SafeImage
 * merender fallback layout resmi berlogo favicon PKM Tonasa.
 */
export function getProductImage(product: Product): string {
  const resolved = resolveStorageUrl(product.image_url);
  if (resolved) {
    return resolved;
  }
  return '';
}
