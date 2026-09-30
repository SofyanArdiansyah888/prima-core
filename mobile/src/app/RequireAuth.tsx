import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/auth';
import { AppLoadingSkeleton } from '../shared/ui';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth();

  if (!ready) {
    return <AppLoadingSkeleton />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
