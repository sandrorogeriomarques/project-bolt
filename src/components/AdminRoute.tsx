import { Navigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useUserStore();

  // Verificar se o usuário está autenticado e é admin
  if (!user) {
    console.log('Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    console.log('Usuário não é admin, redirecionando para home');
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
