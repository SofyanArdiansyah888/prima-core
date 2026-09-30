import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Customer } from '../domain/types';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

type AuthContextValue = {
  token: string | null;
  customer: Customer | null;
  ready: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: { name: string; phone: string; email?: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCustomer: (customer: Customer) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const CUSTOMER_KEY = 'pkm_customer';

function readCustomer(): Customer | null {
  const raw = localStorage.getItem(CUSTOMER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Customer;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [customer, setCustomerState] = useState<Customer | null>(() => readCustomer());
  const [ready, setReady] = useState(false);

  const applySession = (nextToken: string, nextCustomer: Customer) => {
    setToken(nextToken);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextCustomer));
    setTokenState(nextToken);
    setCustomerState(nextCustomer);
  };

  const clearSession = () => {
    setToken(null);
    localStorage.removeItem(CUSTOMER_KEY);
    setTokenState(null);
    setCustomerState(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    if (!token) {
      setReady(true);
      return;
    }

    api.me()
      .then((response) => {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data));
        setCustomerState(response.data);
      })
      .catch(() => clearSession())
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    customer,
    ready,
    async login(phone, password) {
      const response = await api.login({ phone, password });
      applySession(response.token, response.customer);
    },
    async register(payload) {
      const response = await api.register(payload);
      applySession(response.token, response.customer);
    },
    async logout() {
      try {
        await api.logout();
      } finally {
        clearSession();
      }
    },
    async refresh() {
      const response = await api.me();
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data));
      setCustomerState(response.data);
    },
    setCustomer(next) {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(next));
      setCustomerState(next);
    },
  }), [token, customer, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  }

  return value;
}
