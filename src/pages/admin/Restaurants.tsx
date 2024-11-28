import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { getRestaurants, updateRestaurant } from '../../services/restaurantService';
import { Restaurant } from '../../types';
import toast from 'react-hot-toast';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActive, setShowActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRestaurants();
      console.log('Restaurants data:', data); // Debug log
      setRestaurants(data);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Erro ao carregar restaurantes');
      toast.error('Erro ao carregar restaurantes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (restaurant: Restaurant) => {
    try {
      await updateRestaurant(restaurant.id, { field_3040220: !restaurant.field_3040220 });
      toast.success('Status atualizado com sucesso');
      await loadRestaurants();
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      toast.error('Erro ao atualizar status do restaurante');
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.field_3040201?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.field_3040218?.toLowerCase().includes(searchTerm.toLowerCase());

    if (showActive === null) return matchesSearch;
    return matchesSearch && restaurant.field_3040220 === showActive;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={loadRestaurants}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Restaurantes</h1>
            <p className="mt-2 text-sm text-gray-700">
              Lista de todos os restaurantes cadastrados no sistema.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/admin/restaurants/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Restaurante
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar restaurantes..."
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <select
                value={showActive === null ? '' : showActive.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setShowActive(value === '' ? null : value === 'true');
                }}
                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum restaurante encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros ou criar um novo restaurante.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Nome
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Endereço
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredRestaurants.map((restaurant) => (
                          <tr key={restaurant.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {restaurant.field_3040201 || 'Sem nome'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {restaurant.field_3040218 || 'Sem endereço'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <button
                                onClick={() => handleToggleStatus(restaurant)}
                                className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                                  restaurant.field_3040220
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {restaurant.field_3040220 ? (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-1" />
                                )}
                                {restaurant.field_3040220 ? 'Ativo' : 'Inativo'}
                              </button>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link
                                to={`/admin/restaurants/${restaurant.id}`}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Editar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
