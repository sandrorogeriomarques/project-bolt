import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRestaurant, createRestaurant, updateRestaurant } from '../../services/restaurantService';
import { searchCEP } from '../../services/cepService';
import { toast } from 'react-hot-toast';
import { Restaurant } from '../../types';

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
    field_3040220: true, // active
  });

  useEffect(() => {
    if (isEditing) {
      loadRestaurant();
    }
  }, [isEditing]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const data = await getRestaurant(Number(id));
      setFormData(data);
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
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCep(e.target.value);
    setFormData(prev => ({
      ...prev,
      field_3040217: formattedCep
    }));

    if (formattedCep.length === 9) {
      searchCep(formattedCep);
    }
  };

  const searchCep = async (cep: string) => {
    try {
      setLoading(true);
      const cleanCep = cep.replace(/\D/g, '');
      const data = await searchCEP(cleanCep);
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          field_3040211: data.street || prev.field_3040211,
          field_3040213: data.neighborhood || prev.field_3040213,
          field_3040215: data.city || prev.field_3040215,
          field_3040216: data.state || prev.field_3040216
        }));
        toast.success('CEP encontrado!');
      }
    } catch (err) {
      toast.error('Erro ao buscar CEP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Atualiza o endereço completo antes de salvar
      const fullAddress = [
        formData.field_3040211, // street
        formData.field_3040212 && `nº ${formData.field_3040212}`, // number
        formData.field_3040213, // neighborhood
        formData.field_3040215, // city
        formData.field_3040216 // state
      ].filter(Boolean).join(', ');

      const dataToSave = {
        ...formData,
        field_3040218: fullAddress // full_address
      };

      if (isEditing) {
        await updateRestaurant(Number(id), dataToSave);
        toast.success('Restaurante atualizado com sucesso!');
      } else {
        await createRestaurant(dataToSave);
        toast.success('Restaurante criado com sucesso!');
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Editar Restaurante' : 'Novo Restaurante'}
      </h1>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="field_3040210" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            id="field_3040210"
            name="field_3040210"
            value={formData.field_3040210 || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="field_3040217" className="block text-sm font-medium text-gray-700">
              CEP
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="field_3040217"
                name="field_3040217"
                value={formData.field_3040217 || ''}
                onChange={handleCepChange}
                maxLength={9}
                placeholder="00000-000"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="field_3040212" className="block text-sm font-medium text-gray-700">
              Número
            </label>
            <input
              type="text"
              id="field_3040212"
              name="field_3040212"
              value={formData.field_3040212 || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="field_3040211" className="block text-sm font-medium text-gray-700">
            Rua
          </label>
          <input
            type="text"
            id="field_3040211"
            name="field_3040211"
            value={formData.field_3040211 || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="field_3040213" className="block text-sm font-medium text-gray-700">
            Bairro
          </label>
          <input
            type="text"
            id="field_3040213"
            name="field_3040213"
            value={formData.field_3040213 || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="field_3040215" className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              type="text"
              id="field_3040215"
              name="field_3040215"
              value={formData.field_3040215 || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="field_3040216" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <input
              type="text"
              id="field_3040216"
              name="field_3040216"
              value={formData.field_3040216 || ''}
              onChange={handleInputChange}
              maxLength={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="field_3040219" className="block text-sm font-medium text-gray-700">
            Coordenadas
          </label>
          <input
            type="text"
            id="field_3040219"
            name="field_3040219"
            value={formData.field_3040219 || ''}
            onChange={handleInputChange}
            placeholder="latitude,longitude"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="field_3040220"
            name="field_3040220"
            checked={formData.field_3040220}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="field_3040220" className="ml-2 block text-sm text-gray-900">
            Ativo
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/restaurants')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
