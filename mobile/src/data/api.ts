import type { Customer, CustomerOrder, Product, ProductCategory, Quote } from '../domain/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
const TOKEN_KEY = 'pkm_customer_token';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}/api/customer/v1${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (response.status === 401 && auth) {
    onUnauthorized();
  }

  if (!response.ok) {
    const errors = body.errors as Record<string, string[]> | undefined;
    const first = errors ? Object.values(errors).flat()[0] : undefined;
    throw new ApiError(first || body.message || 'Permintaan gagal.');
  }

  return body as T;
}

export const api = {
  register(payload: { name: string; phone: string; email?: string; password: string; password_confirmation: string }) {
    return request<{ token: string; customer: Customer }>('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
  },
  login(payload: { phone: string; password: string }) {
    return request<{ token: string; customer: Customer }>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
  },
  logout() {
    return request<{ message: string }>('/logout', { method: 'POST' });
  },
  me() {
    return request<{ data: Customer }>('/me');
  },
  updateMe(payload: { name: string; phone: string; email?: string | null }) {
    return request<{ data: Customer }>('/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  products(category: ProductCategory) {
    return request<{ data: Product[] }>(`/products?category=${category}`);
  },
  product(uuid: string) {
    return request<{ data: Product }>(`/products/${uuid}`);
  },
  quote(payload: { delivery_lat: number; delivery_lng: number; items: { product_uuid: string; quantity: number }[] }) {
    return request<{ data: Quote }>('/delivery/quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  orders(page = 1) {
    return request<{ data: CustomerOrder[]; meta: { current_page: number; last_page: number } }>(`/orders?page=${page}`);
  },
  order(uuid: string) {
    return request<{ data: CustomerOrder }>(`/orders/${uuid}`);
  },
  createOrder(payload: {
    project_title: string;
    delivery_address: string;
    delivery_lat: number;
    delivery_lng: number;
    payment_method: string;
    notes?: string;
    items: { product_uuid: string; quantity: number }[];
  }) {
    return request<{ data: CustomerOrder }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  payOrder(uuid: string, refresh = false) {
    return request<{ data: CustomerOrder }>(`/orders/${uuid}/pay`, {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  },
  cancelOrder(uuid: string) {
    return request<{ data: CustomerOrder }>(`/orders/${uuid}/cancel`, { method: 'POST' });
  },
};
