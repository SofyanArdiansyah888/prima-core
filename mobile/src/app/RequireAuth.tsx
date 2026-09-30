import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/auth';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth();

  if (!ready) {
    return <div className="bg-canvas p-6 text-xs text-muted">Memuat akun…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
