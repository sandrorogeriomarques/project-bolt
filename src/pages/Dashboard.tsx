import { useUserStore } from '../stores/userStore';
import { Link } from 'react-router-dom';
import { Package, Camera, User, Settings } from 'lucide-react';

export function Dashboard() {
  const user = useUserStore(state => state.user);

  const quickLinks = [
    {
      title: 'Nova Entrega',
      description: 'Adicionar uma nova entrega',
      icon: Camera,
      to: '/deliveries',
      color: 'bg-blue-500'
    },
    {
      title: 'Perfil',
      description: 'Gerenciar seu perfil',
      icon: User,
      to: '/profile',
      color: 'bg-green-500'
    },
    {
      title: 'Configurações',
      description: 'Ajustar configurações',
      icon: Settings,
      to: '/settings',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Aqui está um resumo da sua conta
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Entregas</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${link.color}`}>
                <link.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{link.title}</h3>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}