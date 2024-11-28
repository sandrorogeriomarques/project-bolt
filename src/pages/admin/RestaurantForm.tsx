import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRestaurant, createRestaurant, updateRestaurant } from '../../services/restaurantService';
import { Restaurant, ViaCepResponse } from '../../types';

export default function RestaurantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    field_3040210: '', // name
    field_3040211: '', // street
    field_3040212: '', // number
    field_3040213: '', // neighborhood
    field_3040215: '', // city
    field_3040216: '', // state
    field_3040217: '', // postal_code
    field_3040218: '', // full_address
    field_3040219: '', // coordinates
    field_3040220: true // active
  });

  useEffect(() => {
    if (isEditing) {
      loadRestaurant();
    }
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const data = await getRestaurant(Number(id));
      setFormData(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar restaurante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatCep = (cep: string): string => {
    cep = cep.replace(/\D/g, '');
    if (cep.length > 5) {
      return `${cep.slice(0, 5)}-${cep.slice(5)}`;
    }
    return cep;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, '');
    const formattedCep = formatCep(rawCep);
    
    setFormData(prev => ({
      ...prev,
      field_3040217: formattedCep
    }));

    if (rawCep.length === 8) {
      searchCep(rawCep);
    }
  };

  const searchCep = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.logradouro) {
        setFormData(prev => ({
          ...prev,
          field_3040211: data.logradouro, // street
          field_3040213: data.bairro, // neighborhood
          field_3040215: data.localidade, // city
          field_3040216: data.uf // state
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Atualiza o endereço completo
      const fullAddress = `${formData.field_3040211}, ${formData.field_3040212} - ${formData.field_3040213}, ${formData.field_3040215} - ${formData.field_3040216}, ${formData.field_3040217}`;
      const completeData = {
        ...formData,
        field_3040218: fullAddress // full_address
      };

      if (isEditing) {
        await updateRestaurant(Number(id), completeData);
      } else {
        await createRestaurant(completeData);
      }

      navigate('/admin/restaurants');
    } catch (err) {
      setError('Erro ao salvar restaurante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Restaurante' : 'Novo Restaurante'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-6 sm:space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              name="field_3040210"
              id="name"
              required
              value={formData.field_3040210}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
              CEP
            </label>
            <input
              type="text"
              name="field_3040217"
              id="postal_code"
              required
              value={formData.field_3040217 || ''}
              onChange={handleCepChange}
              maxLength={9}
              placeholder="Somente números"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Rua
              </label>
              <input
                type="text"
                name="field_3040211"
                id="street"
                required
                value={formData.field_3040211}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                Número
              </label>
              <input
                type="text"
                name="field_3040212"
                id="number"
                required
                value={formData.field_3040212}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
              Bairro
            </label>
            <input
              type="text"
              name="field_3040213"
              id="neighborhood"
              required
              value={formData.field_3040213}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                Cidade
              </label>
              <input
                type="text"
                name="field_3040215"
                id="city"
                required
                value={formData.field_3040215}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <input
                type="text"
                name="field_3040216"
                id="state"
                required
                value={formData.field_3040216}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700">
              Coordenadas (latitude,longitude)
            </label>
            <input
              type="text"
              name="field_3040219"
              id="coordinates"
              value={formData.field_3040219}
              onChange={handleInputChange}
              placeholder="Ex: -23.550520,-46.633308"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="relative flex items-start">
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                name="field_3040220"
                id="active"
                checked={formData.field_3040220}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="active" className="font-medium text-gray-700">
                Ativo
              </label>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/restaurants')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
