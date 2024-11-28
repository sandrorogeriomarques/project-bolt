import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRestaurant, getRestaurant, updateRestaurant } from '../../services/restaurantService';
import { Restaurant } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function RestaurantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    coordinates: '',
    active: true
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
    } catch (err) {
      setError('Erro ao carregar dados do restaurante');
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

  const searchCep = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.logradouro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
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
      const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.postal_code}`;
      const completeData = {
        ...formData,
        full_address: fullAddress
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
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/restaurants')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para lista
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {isEditing ? 'Editar Restaurante' : 'Novo Restaurante'}
      </h1>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={formData.name}
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
            name="postal_code"
            id="postal_code"
            required
            value={formData.postal_code}
            onChange={(e) => {
              const cep = e.target.value.replace(/\D/g, '');
              handleInputChange({
                ...e,
                target: { ...e.target, value: cep }
              } as React.ChangeEvent<HTMLInputElement>);
              if (cep.length === 8) {
                searchCep(cep);
              }
            }}
            maxLength={8}
            placeholder="Somente números"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
              Rua
            </label>
            <input
              type="text"
              name="street"
              id="street"
              required
              value={formData.street}
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
              name="number"
              id="number"
              required
              value={formData.number}
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
            name="neighborhood"
            id="neighborhood"
            required
            value={formData.neighborhood}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              type="text"
              name="city"
              id="city"
              required
              value={formData.city}
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
              name="state"
              id="state"
              required
              value={formData.state}
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
            name="coordinates"
            id="coordinates"
            value={formData.coordinates}
            onChange={handleInputChange}
            placeholder="Ex: -23.550520,-46.633308"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="active"
            id="active"
            checked={formData.active}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Ativo
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/restaurants')}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
