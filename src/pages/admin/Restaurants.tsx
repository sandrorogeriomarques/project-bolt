import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { getRestaurants, updateRestaurant } from '../../services/restaurantService';
import { Restaurant } from '../../types';
import { Plus, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminRestaurants() {
=======
import { Pencil, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { getRestaurants, updateRestaurant } from '../../services/restaurantService';
import { Restaurant } from '../../types';

export default function Restaurants() {
>>>>>>> fix/cep-form-baserow
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
      const data = await getRestaurants();
      setRestaurants(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar restaurantes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (restaurant: Restaurant) => {
    try {
<<<<<<< HEAD
      await updateRestaurant(restaurant.id, { active: !restaurant.active });
=======
      await updateRestaurant(restaurant.id, { field_3040220: !restaurant.field_3040220 });
>>>>>>> fix/cep-form-baserow
      await loadRestaurants();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status do restaurante');
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
<<<<<<< HEAD
    const matchesSearch = 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.full_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showActive === null) return matchesSearch;
    return matchesSearch && restaurant.active === showActive;
=======
    const searchTermLower = searchTerm.toLowerCase();
    const fullAddress = restaurant.field_3040218 || '';
    
    const matchesSearch = restaurant.field_3040210.toLowerCase().includes(searchTermLower) ||
                         fullAddress.toLowerCase().includes(searchTermLower);
    
    if (showActive === null) return matchesSearch;
    return matchesSearch && restaurant.field_3040220 === showActive;
>>>>>>> fix/cep-form-baserow
  });

  if (loading) {
    return (
      <div className="p-4">
<<<<<<< HEAD
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
=======
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
>>>>>>> fix/cep-form-baserow
          </div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="p-4">
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Restaurantes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os restaurantes cadastrados no sistema
          </p>
        </div>
        <Link
          to="/admin/restaurants/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Restaurante
        </Link>
      </div>

      <div className="mb-4">
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Buscar por nome ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setShowActive(null)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            showActive === null
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setShowActive(true)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            showActive === true
              ? 'bg-green-100 text-green-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setShowActive(false)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            showActive === false
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Inativos
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
=======
    <div className="px-4 sm:px-6 lg:px-8">
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
            <PlusCircle className="h-5 w-5 mr-2" />
            Novo Restaurante
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
>>>>>>> fix/cep-form-baserow
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
=======
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Buscar por nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={showActive === null ? '' : showActive.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setShowActive(value === '' ? null : value === 'true');
                }}
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>

>>>>>>> fix/cep-form-baserow
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
<<<<<<< HEAD
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Nome
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Endereço
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
=======
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Nome
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Endereço
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
>>>>>>> fix/cep-form-baserow
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
<<<<<<< HEAD
                        {restaurant.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {restaurant.full_address}
=======
                        {restaurant.field_3040210}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {restaurant.field_3040218}
>>>>>>> fix/cep-form-baserow
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
<<<<<<< HEAD
                            restaurant.active
=======
                            restaurant.field_3040220
>>>>>>> fix/cep-form-baserow
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
<<<<<<< HEAD
                          {restaurant.active ? 'Ativo' : 'Inativo'}
=======
                          {restaurant.field_3040220 ? 'Ativo' : 'Inativo'}
>>>>>>> fix/cep-form-baserow
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/restaurants/${restaurant.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
<<<<<<< HEAD
                            <Edit2 className="h-5 w-5" />
=======
                            <Pencil className="h-5 w-5" />
>>>>>>> fix/cep-form-baserow
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(restaurant)}
                            className={`${
<<<<<<< HEAD
                              restaurant.active
=======
                              restaurant.field_3040220
>>>>>>> fix/cep-form-baserow
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
<<<<<<< HEAD
                            {restaurant.active ? (
=======
                            {restaurant.field_3040220 ? (
>>>>>>> fix/cep-form-baserow
                              <XCircle className="h-5 w-5" />
                            ) : (
                              <CheckCircle className="h-5 w-5" />
                            )}
                          </button>
                        </div>
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
  );
}
