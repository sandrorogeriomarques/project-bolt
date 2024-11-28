<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Restaurant, BaserowFields } from '../../types/index';
import { createRestaurant, getRestaurant, updateRestaurant } from '../../services/restaurantService';
import { searchCEP } from '../../services/cepService';

export function RestaurantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({
    [BaserowFields.Restaurant.NAME]: '',
    [BaserowFields.Restaurant.STREET]: '',
    [BaserowFields.Restaurant.NUMBER]: '',
    [BaserowFields.Restaurant.NEIGHBORHOOD]: '',
    [BaserowFields.Restaurant.CITY]: '',
    [BaserowFields.Restaurant.STATE]: '',
    [BaserowFields.Restaurant.POSTAL_CODE]: '',
    [BaserowFields.Restaurant.FULL_ADDRESS]: '',
    [BaserowFields.Restaurant.COORDINATES]: '',
    [BaserowFields.Restaurant.ACTIVE]: true
  });
  const searchTimeout = useRef<NodeJS.Timeout>();
  const isAutoSearch = useRef(false);

  useEffect(() => {
    if (id) {
      loadRestaurant(parseInt(id));
    }
  }, [id]);

  const loadRestaurant = async (restaurantId: number) => {
    try {
      setLoading(true);
      const data = await getRestaurant(restaurantId);
      setRestaurant(data);
    } catch (error) {
      console.error('Erro ao carregar restaurante:', error);
      toast.error('Erro ao carregar dados do restaurante');
=======
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
>>>>>>> fix/cep-form-baserow
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await updateRestaurant(parseInt(id), restaurant);
        toast.success('Restaurante atualizado com sucesso!');
      } else {
        await createRestaurant(restaurant);
        toast.success('Restaurante criado com sucesso!');
      }
      navigate('/admin/restaurants');
    } catch (error) {
      console.error('Erro ao salvar restaurante:', error);
      toast.error('Erro ao salvar restaurante');
=======
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
>>>>>>> fix/cep-form-baserow
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const formatCEP = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Se tiver 8 dígitos, formata como 99999-999
    if (limitedNumbers.length === 8) {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
    
    // Se tiver mais de 5 dígitos, adiciona o hífen
    if (limitedNumbers.length > 5) {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
    
    return limitedNumbers;
  };

  const cleanCEP = (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    return numbers.slice(0, 8); // Garante que teremos no máximo 8 dígitos
  };

  const isValidCEP = (cep: string) => {
    const numbers = cleanCEP(cep);
    console.log('Validando CEP:', { original: cep, limpo: numbers, tamanho: numbers.length }); // Debug
    return numbers.length === 8;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const formattedValue = formatCEP(value);
    const numbers = cleanCEP(formattedValue);
    
    console.log('Processando CEP:', { 
      input: value,
      formatted: formattedValue,
      numbers,
      length: numbers.length 
    });

    // Atualiza o valor do input
    e.target.value = formattedValue;

    // Atualiza o estado e agenda a busca se necessário
    if (numbers.length === 8) {
      // Atualiza o estado e garante que a busca use o valor atualizado
      setRestaurant(prev => {
        const updatedRestaurant = {
          ...prev,
          [BaserowFields.Restaurant.POSTAL_CODE]: formattedValue
        };

        // Cancela busca anterior se existir
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }

        console.log('Agendando busca automática para CEP:', formattedValue, 'números:', numbers);
        isAutoSearch.current = true;
        
        // Importante: Usar uma closure para garantir que usamos o valor atual
        const currentFormattedValue = formattedValue;
        searchTimeout.current = setTimeout(() => {
          handleCEPSearch(currentFormattedValue);
        }, 500);

        return updatedRestaurant;
      });
    } else {
      // Apenas atualiza o estado sem agendar busca
      setRestaurant(prev => ({
        ...prev,
        [BaserowFields.Restaurant.POSTAL_CODE]: formattedValue
      }));
    }
  };

  const handleCEPSearch = async (forcedCEP?: string) => {
    // Usa o CEP forçado (da busca automática) ou o CEP do estado
    const currentCEP = forcedCEP || restaurant[BaserowFields.Restaurant.POSTAL_CODE];
    console.log('Iniciando busca de CEP:', currentCEP);
    
    if (!currentCEP) {
      console.log('CEP vazio');
      return;
    }

    try {
      setLoading(true);
      const numbers = cleanCEP(currentCEP);
      console.log('CEP para busca:', { 
        original: currentCEP, 
        limpo: numbers, 
        tamanho: numbers.length 
      });
      
      if (numbers.length !== 8) {
        console.log('CEP inválido:', numbers);
        if (!isAutoSearch.current) {
          toast.error('CEP inválido');
        }
        return;
      }

      const addressData = await searchCEP(numbers);
      console.log('Dados do endereço:', addressData);
      
      if (addressData) {
        const updatedData = {
          ...restaurant,
          [BaserowFields.Restaurant.POSTAL_CODE]: currentCEP,
          [BaserowFields.Restaurant.STREET]: addressData.street || restaurant[BaserowFields.Restaurant.STREET],
          [BaserowFields.Restaurant.NEIGHBORHOOD]: addressData.neighborhood || restaurant[BaserowFields.Restaurant.NEIGHBORHOOD],
          [BaserowFields.Restaurant.CITY]: addressData.city || restaurant[BaserowFields.Restaurant.CITY],
          [BaserowFields.Restaurant.STATE]: addressData.state || restaurant[BaserowFields.Restaurant.STATE]
        };

        setRestaurant(updatedData);
        updateFullAddress(updatedData);
        toast.success('Endereço encontrado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      if (!isAutoSearch.current) {
        toast.error(error instanceof Error ? error.message : 'CEP não encontrado ou inválido');
      }
    } finally {
      setLoading(false);
      isAutoSearch.current = false;
    }
  };

  const updateFullAddress = (data: Partial<Restaurant>) => {
    const street = data[BaserowFields.Restaurant.STREET];
    const number = data[BaserowFields.Restaurant.NUMBER];
    const neighborhood = data[BaserowFields.Restaurant.NEIGHBORHOOD];
    const city = data[BaserowFields.Restaurant.CITY];
    const state = data[BaserowFields.Restaurant.STATE];

    const fullAddress = [
      street,
      number && `nº ${number}`,
      neighborhood,
      city,
      state
    ].filter(Boolean).join(', ');

    setRestaurant(prev => ({
      ...prev,
      ...data,
      [BaserowFields.Restaurant.FULL_ADDRESS]: fullAddress
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    const updatedRestaurant = {
      ...restaurant,
      [name]: newValue
    };

    if ([
      BaserowFields.Restaurant.STREET,
      BaserowFields.Restaurant.NUMBER,
      BaserowFields.Restaurant.NEIGHBORHOOD,
      BaserowFields.Restaurant.CITY,
      BaserowFields.Restaurant.STATE
    ].includes(name)) {
      updateFullAddress(updatedRestaurant);
    } else {
      setRestaurant(updatedRestaurant);
    }
  };

  if (loading && id) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {id ? 'Editar Restaurante' : 'Novo Restaurante'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            name={BaserowFields.Restaurant.NAME}
            value={restaurant[BaserowFields.Restaurant.NAME] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CEP
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name={BaserowFields.Restaurant.POSTAL_CODE}
                value={restaurant[BaserowFields.Restaurant.POSTAL_CODE] || ''}
                onChange={handleCEPChange}
                placeholder="00000-000"
                className="block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  isAutoSearch.current = false;
                  handleCEPSearch();
                }}
                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
              >
                Buscar
              </button>
=======
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
>>>>>>> fix/cep-form-baserow
            </div>
          </div>

          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-gray-700">
              Número
            </label>
            <input
              type="text"
              name={BaserowFields.Restaurant.NUMBER}
              value={restaurant[BaserowFields.Restaurant.NUMBER] || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rua
          </label>
          <input
            type="text"
            name={BaserowFields.Restaurant.STREET}
            value={restaurant[BaserowFields.Restaurant.STREET] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bairro
          </label>
          <input
            type="text"
            name={BaserowFields.Restaurant.NEIGHBORHOOD}
            value={restaurant[BaserowFields.Restaurant.NEIGHBORHOOD] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              type="text"
              name={BaserowFields.Restaurant.CITY}
              value={restaurant[BaserowFields.Restaurant.CITY] || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <input
              type="text"
              name={BaserowFields.Restaurant.STATE}
              value={restaurant[BaserowFields.Restaurant.STATE] || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              maxLength={2}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Endereço Completo
          </label>
          <input
            type="text"
            name={BaserowFields.Restaurant.FULL_ADDRESS}
            value={restaurant[BaserowFields.Restaurant.FULL_ADDRESS] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Coordenadas
          </label>
          <input
            type="text"
            name={BaserowFields.Restaurant.COORDINATES}
            value={restaurant[BaserowFields.Restaurant.COORDINATES] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="latitude,longitude"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name={BaserowFields.Restaurant.ACTIVE}
            checked={restaurant[BaserowFields.Restaurant.ACTIVE] || false}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="ml-2 block text-sm text-gray-900">
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
=======
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
>>>>>>> fix/cep-form-baserow
        </div>
      </form>
    </div>
  );
}
