import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { Link } from 'react-router-dom';
import { Package, Camera, User, Settings, Store } from 'lucide-react';
import { getActiveRestaurantsCount } from '../services/restaurantService';

export function Dashboard() {
  const user = useUserStore(state => state.user);
  const [activeRestaurants, setActiveRestaurants] = useState(0);

  useEffect(() => {
    const loadActiveRestaurants = async () => {
      try {
        const count = await getActiveRestaurantsCount();
        setActiveRestaurants(count);
      } catch (error) {
        console.error('Error loading active restaurants count:', error);
      }
    };
    loadActiveRestaurants();
  }, []);

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

      {/* Stats */}
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Deliveries Stats */}
        <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
          <dt>
            <div className="absolute rounded-md p-3 text-blue-600 bg-opacity-10">
              <Package className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">Total de Entregas</p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </dd>
        </div>

        {/* Active Restaurants Stats */}
        <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
          <dt>
            <div className="absolute rounded-md p-3 text-green-600 bg-opacity-10">
              <Store className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">Restaurantes Ativos</p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{activeRestaurants}</p>
          </dd>
        </div>
      </dl>

      {/* Quick Links */}
      <h2 className="text-lg font-medium text-gray-900 mb-4 mt-8">Ações Rápidas</h2>
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