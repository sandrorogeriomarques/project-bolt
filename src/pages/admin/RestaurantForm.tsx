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
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

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
            </div>
          </div>

          <div>
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
        </div>
      </form>
    </div>
  );
}
