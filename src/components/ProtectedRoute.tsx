import { Navigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}