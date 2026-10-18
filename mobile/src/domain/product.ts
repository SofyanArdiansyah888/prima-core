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

export const FALLBACK_PRODUCT_IMAGES: Record<string, string> = {
  'ST-BULK-300T': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=600',
  'ST-OPC-50KG': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600',
  'ST-PCC-50KG': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
  'RM-K175': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=600',
  'RM-K225': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
  'RM-K300': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=600',
  'RM-K350': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=600',
  'RM-K500': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600',
  'MORTAR-BI-40KG': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600',
};

/**
 * Mengambil URL gambar produk yang diunggah dari backend dashboard.
 * Jika belum diunggah, akan menggunakan fallback gambar default.
 */
export function getProductImage(product: Product): string {
  const resolved = resolveStorageUrl(product.image_url);
  if (resolved) {
    return resolved;
  }
  if (FALLBACK_PRODUCT_IMAGES[product.code]) {
    return FALLBACK_PRODUCT_IMAGES[product.code];
  }
  if (product.category === 'readymix') {
    return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=600';
  }
  if (product.code.toLowerCase().includes('bulk') || product.name.toLowerCase().includes('curah')) {
    return 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=600';
  }
  return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600';
}
