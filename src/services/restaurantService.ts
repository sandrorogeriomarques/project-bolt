import { Restaurant } from '../types';
import { baserowApi } from './baserowApi';

const RESTAURANTS_TABLE_ID = import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID || '399121';

export async function getRestaurants(): Promise<Restaurant[]> {
  try {
    const response = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`, {
      params: {
        size: 100,
        user_field_names: false
      }
    });
    
    // Buscar histórico para restaurantes inativos
    const mappedRestaurants = await Promise.all(response.data.results.map(async (restaurant: any) => {
      // Se o restaurante está inativo e não tem dados, buscar histórico
      if (!restaurant.field_3040220 && !restaurant.field_3040210) {
        try {
          // Buscar histórico do restaurante
          const historyResponse = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`, {
            params: {
              filter__field_3040220__equal: true,
              filter__id__equal: restaurant.id,
              include_field_options: true,
              user_field_names: false
            }
          });
          
          // Se encontrou histórico, usar os dados do histórico
          if (historyResponse.data.results && historyResponse.data.results.length > 0) {
            const historicData = historyResponse.data.results[0];
            return {
              id: restaurant.id,
              field_3040210: historicData.field_3040210,
              field_3040211: historicData.field_3040211,
              field_3040212: historicData.field_3040212,
              field_3040213: historicData.field_3040213,
              field_3040215: historicData.field_3040215,
              field_3040216: historicData.field_3040216,
              field_3040217: historicData.field_3040217,
              field_3040218: historicData.field_3040218,
              field_3040219: historicData.field_3040219,
              field_3040220: false // Mantém como inativo
            };
          }
        } catch (error) {
          console.error('Erro ao buscar histórico do restaurante:', error);
        }
      }
      
      // Retorna os dados normalmente se não for inativo ou se não encontrou histórico
      return {
        id: restaurant.id,
        field_3040210: restaurant.field_3040210,
        field_3040211: restaurant.field_3040211,
        field_3040212: restaurant.field_3040212,
        field_3040213: restaurant.field_3040213,
        field_3040215: restaurant.field_3040215,
        field_3040216: restaurant.field_3040216,
        field_3040217: restaurant.field_3040217,
        field_3040218: restaurant.field_3040218,
        field_3040219: restaurant.field_3040219,
        field_3040220: restaurant.field_3040220
      };
    }));
    
    return mappedRestaurants;
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    throw error;
  }
}

export async function getRestaurant(id: number): Promise<Restaurant> {
  try {
    const response = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`);
    console.log('API Response (getRestaurant):', response.data); // Debug log
    return {
      id: response.data.id,
      field_3040210: response.data.field_3040210 || '', // name
      field_3040211: response.data.field_3040211 || '', // street
      field_3040212: response.data.field_3040212 || '', // number
      field_3040213: response.data.field_3040213 || '', // neighborhood
      field_3040215: response.data.field_3040215 || '', // city
      field_3040216: response.data.field_3040216 || '', // state
      field_3040217: response.data.field_3040217 || '', // postal_code
      field_3040218: response.data.field_3040218 || '', // full_address
      field_3040219: response.data.field_3040219 || '', // coordinates
      field_3040220: response.data.field_3040220 ?? true, // active
    };
  } catch (error) {
    console.error('Erro ao buscar restaurante:', error);
    throw error;
  }
}

export async function createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
  try {
    console.log('Creating restaurant with data:', data); // Debug log
    const response = await baserowApi.post(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`, {
      field_3040210: data.field_3040210 || '', // name
      field_3040211: data.field_3040211 || '', // street
      field_3040212: data.field_3040212 || '', // number
      field_3040213: data.field_3040213 || '', // neighborhood
      field_3040215: data.field_3040215 || '', // city
      field_3040216: data.field_3040216 || '', // state
      field_3040217: data.field_3040217 || '', // postal_code
      field_3040218: data.field_3040218 || '', // full_address
      field_3040219: data.field_3040219 || '', // coordinates
      field_3040220: data.field_3040220 ?? true, // active
    });
    console.log('API Response (createRestaurant):', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Erro ao criar restaurante:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    throw error;
  }
}

export async function updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
  try {
    console.log('Updating restaurant with data:', { id, data }); // Debug log
    
    // Se estamos apenas atualizando o status
    if (Object.keys(data).length === 1 && 'field_3040220' in data) {
      // Busca os dados atuais do restaurante
      const currentRestaurant = await getRestaurant(id);
      
      // Mantém os dados originais e atualiza apenas o status
      const updatedData = {
        field_3040210: currentRestaurant.field_3040210,
        field_3040211: currentRestaurant.field_3040211,
        field_3040212: currentRestaurant.field_3040212,
        field_3040213: currentRestaurant.field_3040213,
        field_3040215: currentRestaurant.field_3040215,
        field_3040216: currentRestaurant.field_3040216,
        field_3040217: currentRestaurant.field_3040217,
        field_3040218: currentRestaurant.field_3040218,
        field_3040219: currentRestaurant.field_3040219,
        field_3040220: data.field_3040220
      };
      
      const response = await baserowApi.patch(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`, updatedData);
      console.log('API Response (updateRestaurant - status only):', response.data); // Debug log
      return response.data;
    }
    
    const response = await baserowApi.patch(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`, {
      field_3040210: data.field_3040210 || '', // name
      field_3040211: data.field_3040211 || '', // street
      field_3040212: data.field_3040212 || '', // number
      field_3040213: data.field_3040213 || '', // neighborhood
      field_3040215: data.field_3040215 || '', // city
      field_3040216: data.field_3040216 || '', // state
      field_3040217: data.field_3040217 || '', // postal_code
      field_3040218: data.field_3040218 || '', // full_address
      field_3040219: data.field_3040219 || '', // coordinates
      field_3040220: data.field_3040220 ?? true, // active
    });
    console.log('API Response (updateRestaurant):', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar restaurante:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    throw error;
  }
}

export async function deleteRestaurant(id: number): Promise<void> {
  try {
    await baserowApi.delete(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`);
  } catch (error) {
    console.error('Erro ao excluir restaurante:', error);
    throw error;
  }
}

export const getActiveRestaurantsCount = async (): Promise<number> => {
  try {
    const response = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`, {
      params: {
        'filter__field_3040220__boolean': true
      }
    });

    return response.data.count;
  } catch (error) {
    console.error('Error getting active restaurants count:', error);
    return 0;
  }
};

export const getRestaurantCoordinates = async (restaurantId: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await baserowApi.get(
      `${import.meta.env.VITE_BASEROW_API_URL}/database/rows/table/${import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID}/${restaurantId}/`,
      {
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_BASEROW_TOKEN}`
        }
      }
    );

    if (response.data && response.data.field_3040219) {
      const [lat, lng] = response.data.field_3040219.split(',').map(Number);
      return { lat, lng };
    }
    
    // Se não houver coordenadas, mas houver endereço completo
    if (response.data && response.data.field_3040218) {
      // Retornar null para indicar que precisa geocodificar
      return null;
    }
    
    throw new Error('Dados do restaurante não encontrados');
  } catch (error) {
    console.error('Erro ao buscar dados do restaurante:', error);
    throw error;
  }
};
