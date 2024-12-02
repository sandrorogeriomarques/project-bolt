import { Navigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    // Se não for admin, redireciona para a home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
