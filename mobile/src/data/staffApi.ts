import type { DriverDeliverySummary, SalesOrderSummary, StaffUser } from '../domain/types';

// Fallback sama dengan api.ts: build tanpa VITE_API_URL (mis. APK) tetap menembak server produksi.
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'https://pkm.orcaid.cloud').replace(/\/+$/, '');
const STAFF_TOKEN_KEY = 'pkm_staff_token';
const STAFF_USER_KEY = 'pkm_staff_user';

export function getStaffToken(): string | null {
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export function setStaffToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STAFF_TOKEN_KEY);
  }
}

export function getStaffUser(): StaffUser | null {
  const raw = localStorage.getItem(STAFF_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export function setStaffUser(user: StaffUser | null): void {
  if (user) {
    localStorage.setItem(STAFF_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STAFF_USER_KEY);
  }
}

async function staffRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStaffToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, any>;

  if (!response.ok) {
    const errorMsg =
      body.message ||
      (body.errors ? Object.values(body.errors).flat().join(', ') : 'Terjadi kesalahan sistem.');
    throw new Error(errorMsg);
  }

  return body as T;
}

export const staffApi = {
  async loginStaff(payload: { login: string; password: string }): Promise<{ token: string; user: StaffUser }> {
    const res = await staffRequest<{ token: string; user: StaffUser }>('/api/staff/v1/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStaffToken(res.token);
    setStaffUser(res.user);
    return res;
  },

  logoutStaff() {
    if (getStaffToken()) {
      void staffRequest('/api/staff/v1/logout', { method: 'POST' }).catch(() => undefined);
    }
    setStaffToken(null);
    setStaffUser(null);
  },

  // Sales APIs
  getSalesOrders(tab: 'pending' | 'history' = 'pending') {
    return staffRequest<{ data: SalesOrderSummary[]; meta: { current_page: number; last_page: number; total: number } }>(
      `/api/sales/v1/orders?tab=${tab}`
    );
  },

  getSalesOrderDetail(uuid: string) {
    return staffRequest<{ data: SalesOrderSummary }>(`/api/sales/v1/orders/${uuid}`);
  },

  approveSalesOrder(
    uuid: string,
    payload: {
      delivery_lat?: number;
      delivery_lng?: number;
      delivery_address?: string;
      survey_notes?: string;
    }
  ) {
    return staffRequest<{ message: string; data: SalesOrderSummary }>(`/api/sales/v1/orders/${uuid}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  rejectSalesOrder(uuid: string, payload: { rejection_reason: string }) {
    return staffRequest<{ message: string; data: SalesOrderSummary }>(`/api/sales/v1/orders/${uuid}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Driver APIs
  getDriverDeliveries(tab: 'active' | 'completed' = 'active') {
    return staffRequest<{ data: DriverDeliverySummary[]; meta: { current_page: number; last_page: number; total: number } }>(
      `/api/driver/v1/deliveries?tab=${tab}`
    );
  },

  completeDriverDelivery(uuid: string, payload: { recipient_name: string; notes?: string }) {
    return staffRequest<{ message: string; data: DriverDeliverySummary }>(`/api/driver/v1/deliveries/${uuid}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
