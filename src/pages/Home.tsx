import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Se o usuário estiver logado, redireciona para o dashboard
    // Caso contrário, redireciona para o login
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  // Este componente não renderiza nada pois sempre redireciona
  return null;
}
