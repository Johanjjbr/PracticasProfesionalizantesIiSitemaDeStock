import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
