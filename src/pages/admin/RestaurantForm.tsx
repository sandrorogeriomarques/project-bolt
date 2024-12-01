import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRestaurant, createRestaurant, updateRestaurant } from '../../services/restaurantService';
import { searchCEP } from '../../services/cepService';
import { toast } from 'react-hot-toast';
import { Restaurant } from '../../types';
import axios from 'axios';
import debounce from 'lodash/debounce';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Verificar se a chave da API está disponível
if (!GOOGLE_MAPS_API_KEY) {
  console.error('ERRO: Chave da API do Google Maps não encontrada!');
  toast.error('Chave da API do Google Maps não configurada');
}

console.log('Status da API do Google Maps:', {
  chavePresente: !!GOOGLE_MAPS_API_KEY,
  chave: GOOGLE_MAPS_API_KEY ? 'Configurada' : 'Não configurada'
});

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

  // Estado para controlar quando o usuário está digitando e o último endereço geocodificado
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastGeocodedAddressRef = useRef<string>('');

  const [addressPreview, setAddressPreview] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (isEditing) {
      const fetchRestaurant = async () => {
        try {
          setLoading(true);
          const data = await getRestaurant(Number(id));
          if (data) {
            // Garante que todos os campos estão presentes, mesmo que vazios
            setFormData({
              field_3040210: data.field_3040210 || '', // name
              field_3040211: data.field_3040211 || '', // street
              field_3040212: data.field_3040212 || '', // number
              field_3040213: data.field_3040213 || '', // neighborhood
              field_3040215: data.field_3040215 || '', // city
              field_3040216: data.field_3040216 || '', // state
              field_3040217: data.field_3040217 || '', // postal_code
              field_3040218: data.field_3040218 || '', // full_address
              field_3040219: data.field_3040219 || '', // coordinates
              field_3040220: data.field_3040220 ?? true // active
            });
            console.log('Dados do restaurante carregados:', data);
          }
        } catch (error) {
          console.error('Erro ao carregar restaurante:', error);
          toast.error('Erro ao carregar dados do restaurante');
        } finally {
          setLoading(false);
        }
      };

      fetchRestaurant();
    }
  }, [id, isEditing]);

  // Função para lidar com mudanças nos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Atualiza o estado de digitação
    setIsTyping(true);
    
    // Limpa o timeout anterior se existir
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Define um novo timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500); // 1.5 segundos de inatividade

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Função para lidar com o blur do input
  const handleInputBlur = () => {
    // Limpa o timeout se existir
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
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
      
      if (!data) {
        toast.error('CEP não encontrado');
        return;
      }

      console.log('CEP encontrado:', data);
      
      // Só atualiza os campos se realmente tivermos os dados
      setFormData(prev => ({
        ...prev,
        field_3040211: data.street || prev.field_3040211,
        field_3040213: data.neighborhood || prev.field_3040213,
        field_3040215: data.city || prev.field_3040215,
        field_3040216: data.state || prev.field_3040216
      }));
      
      toast.success('CEP encontrado!');
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Erro ao buscar CEP');
      }
      console.error('Erro na busca de CEP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para validar campos do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.field_3040210?.trim()) {
      errors.field_3040210 = 'Nome é obrigatório';
    }
    
    if (!formData.field_3040217?.trim() || !/^\d{5}-?\d{3}$/.test(formData.field_3040217)) {
      errors.field_3040217 = 'CEP inválido';
    }
    
    if (!formData.field_3040211?.trim()) {
      errors.field_3040211 = 'Rua é obrigatória';
    }
    
    if (!formData.field_3040212?.trim()) {
      errors.field_3040212 = 'Número é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para atualizar as coordenadas
  const updateCoordinates = useCallback((coordinates: string) => {
    const [lat, lng] = coordinates.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng });
    }
  }, []);

  // Função melhorada para geocodificar o endereço
  const geocodeAddress = async (): Promise<{formattedAddress: string, coordinates: string} | null> => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      const requiredFields = {
        'field_3040211': 'Rua',
        'field_3040212': 'Número',
        'field_3040213': 'Bairro',
        'field_3040215': 'Cidade',
        'field_3040216': 'Estado'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !formData[key as keyof typeof formData]?.trim())
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }

      const address = [
        formData.field_3040211,
        formData.field_3040212,
        formData.field_3040213,
        formData.field_3040215,
        formData.field_3040216,
        'Brasil'
      ].filter(Boolean).join(', ');

      console.log('Geocodificando endereço:', address);

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address,
            key: GOOGLE_MAPS_API_KEY,
            region: 'br',
            language: 'pt-BR'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results?.[0]) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        const coordinates = `${location.lat},${location.lng}`;
        const formattedAddress = result.formatted_address;
        
        updateCoordinates(coordinates);
        setAddressPreview(formattedAddress);
        
        return { formattedAddress, coordinates };
      } else {
        throw new Error(response.data.error_message || 'Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error_message || error.message);
      }
      throw error;
    }
  };

  // Função melhorada para lidar com mudanças nos campos de endereço
  const handleAddressFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    
    // Limpa o timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Define um novo timeout para geocodificar
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await geocodeAddress();
        if (result) {
          setFormData(prev => ({
            ...prev,
            field_3040218: result.formattedAddress,
            field_3040219: result.coordinates
          }));
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Valida o formulário
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Primeiro, tenta geocodificar o endereço
      const geocodeResult = await geocodeAddress();
      if (!geocodeResult) {
        setLoading(false);
        return;
      }

      // Prepara os dados para salvar, incluindo o endereço formatado e coordenadas
      const dataToSave = {
        ...formData,
        field_3040218: geocodeResult.formattedAddress,
        field_3040219: geocodeResult.coordinates
      };

      console.log('Dados a serem salvos:', dataToSave);

      // Salva os dados
      if (isEditing) {
        await updateRestaurant(Number(id), dataToSave);
        toast.success('Restaurante atualizado com sucesso!');
      } else {
        await createRestaurant(dataToSave);
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

  // Cleanup do timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
          {validationErrors.field_3040210 && (
            <div className="text-red-600 text-sm mt-1">
              {validationErrors.field_3040210}
            </div>
          )}
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
            {validationErrors.field_3040217 && (
              <div className="text-red-600 text-sm mt-1">
                {validationErrors.field_3040217}
              </div>
            )}
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
              onChange={handleAddressFieldChange}
              onBlur={handleInputBlur}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {validationErrors.field_3040212 && (
              <div className="text-red-600 text-sm mt-1">
                {validationErrors.field_3040212}
              </div>
            )}
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
            onChange={handleAddressFieldChange}
            onBlur={handleInputBlur}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {validationErrors.field_3040211 && (
            <div className="text-red-600 text-sm mt-1">
              {validationErrors.field_3040211}
            </div>
          )}
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
            onBlur={handleInputBlur}
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
              onBlur={handleInputBlur}
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
              onBlur={handleInputBlur}
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
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
          />
          <p className="mt-1 text-sm text-gray-500">
            As coordenadas são preenchidas automaticamente com base no endereço
          </p>
        </div>

        {addressPreview && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700">Endereço confirmado:</h3>
            <p className="mt-1 text-sm text-gray-600">{addressPreview}</p>
            {coordinates && (
              <p className="mt-2 text-sm text-gray-500">
                Latitude: {coordinates.lat.toFixed(6)}<br />
                Longitude: {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}

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
