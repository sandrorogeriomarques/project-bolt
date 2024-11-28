import { useState, useEffect } from 'react';
import { Package, Store, Clock, CheckCircle } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getRestaurants } from '../services/restaurantService';

const stats = [
  { name: 'Entregas Hoje', value: '12', icon: Package, color: 'text-blue-600' },
  { name: 'Restaurantes Ativos', value: '0', icon: Store, color: 'text-green-600' },
  { name: 'Tempo Médio', value: '25min', icon: Clock, color: 'text-orange-600' },
  { name: 'Taxa de Conclusão', value: '98%', icon: CheckCircle, color: 'text-purple-600' },
];

const recentDeliveries = [
  {
    id: 1,
    customer: 'João Silva',
    address: 'Rua das Flores, 123',
    status: 'completed',
    time: '10:30',
  },
  {
    id: 2,
    customer: 'Maria Oliveira',
    address: 'Av. Principal, 456',
    status: 'in_progress',
    time: '10:45',
  },
  {
    id: 3,
    customer: 'Pedro Santos',
    address: 'Rua do Comércio, 789',
    status: 'pending',
    time: '11:00',
  },
];

export function Home() {
  const user = useUserStore(state => state.user);
  const [activeRestaurants, setActiveRestaurants] = useState(0);

  useEffect(() => {
    loadActiveRestaurants();
  }, []);

  const loadActiveRestaurants = async () => {
    try {
      const restaurants = await getRestaurants();
      const active = restaurants.filter(r => r.active).length;
      setActiveRestaurants(active);
      stats[1].value = active.toString();
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                >
                  <dt>
                    <div className={`absolute rounded-md p-3 ${item.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </p>
                  </dt>
                  <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {item.value}
                    </p>
                  </dd>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Entregas Recentes
              </h3>
            </div>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Cliente
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Endereço
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Horário
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentDeliveries.map((delivery) => (
                          <tr key={delivery.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {delivery.customer}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {delivery.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  delivery.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : delivery.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {delivery.status === 'completed'
                                  ? 'Concluída'
                                  : delivery.status === 'in_progress'
                                  ? 'Em Andamento'
                                  : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {delivery.time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
