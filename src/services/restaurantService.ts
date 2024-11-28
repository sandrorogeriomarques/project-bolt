<<<<<<< HEAD
import { Restaurant, UserPreferences } from '../types';
import { baserowApi } from './baserowApi';

const RESTAURANTS_TABLE_ID = import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID;
const USER_PREFERENCES_TABLE_ID = import.meta.env.VITE_BASEROW_USER_PREFERENCES_TABLE_ID;

if (!RESTAURANTS_TABLE_ID) {
  throw new Error('VITE_BASEROW_RESTAURANTS_TABLE_ID não encontrado');
}

if (!USER_PREFERENCES_TABLE_ID) {
  throw new Error('VITE_BASEROW_USER_PREFERENCES_TABLE_ID não encontrado');
}

// Funções para gerenciar restaurantes
export async function getRestaurants(): Promise<Restaurant[]> {
  try {
    const response = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`);
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    throw error;
  }
}

export async function getRestaurant(id: number): Promise<Restaurant> {
  try {
    const response = await baserowApi.get(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar restaurante:', error);
    throw error;
  }
}

export async function createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
  try {
    const response = await baserowApi.post(`/database/rows/table/${RESTAURANTS_TABLE_ID}/`, {
      ...data
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar restaurante:', error);
    throw error;
  }
}

export async function updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
  try {
    const response = await baserowApi.patch(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`, {
      ...data
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar restaurante:', error);
    throw error;
  }
}

export async function deleteRestaurant(id: number): Promise<void> {
  try {
    await baserowApi.delete(`/database/rows/table/${RESTAURANTS_TABLE_ID}/${id}/`);
  } catch (error) {
    console.error('Erro ao deletar restaurante:', error);
    throw error;
  }
}

// Funções para gerenciar preferências do usuário
export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  try {
    const response = await baserowApi.get(`/database/rows/table/${USER_PREFERENCES_TABLE_ID}/`, {
      params: {
        filter__field_user_id__equal: userId
      }
    });
    
    return response.data.results[0] || null;
  } catch (error) {
    console.error('Erro ao buscar preferências do usuário:', error);
    throw error;
  }
}

export async function createUserPreferences(userId: number, restaurantId: number): Promise<UserPreferences> {
  try {
    const response = await baserowApi.post(`/database/rows/table/${USER_PREFERENCES_TABLE_ID}/`, {
      user_id: userId,
      selected_restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar preferências do usuário:', error);
    throw error;
  }
}

export async function updateUserPreferences(userId: number, restaurantId: number): Promise<UserPreferences> {
  try {
    // Primeiro, busca as preferências existentes
    const preferences = await getUserPreferences(userId);
    
    if (preferences) {
      // Se existir, atualiza
      const response = await baserowApi.patch(`/database/rows/table/${USER_PREFERENCES_TABLE_ID}/${preferences.id}/`, {
        selected_restaurant_id: restaurantId,
        updated_at: new Date().toISOString()
      });
      return response.data;
    } else {
      // Se não existir, cria
      return createUserPreferences(userId, restaurantId);
    }
  } catch (error) {
    console.error('Erro ao atualizar preferências do usuário:', error);
    throw error;
  }
}
=======
import axios from 'axios';
import { Restaurant } from '../types';

const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const TOKEN = import.meta.env.VITE_BASEROW_TOKEN;
const TABLE_ID = '399121'; // Restaurants table

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Token ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

export const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const response = await api.get(`/database/rows/table/${TABLE_ID}/`);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
};

export const getRestaurant = async (id: number): Promise<Restaurant> => {
  try {
    const response = await api.get(`/database/rows/table/${TABLE_ID}/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    throw error;
  }
};

export const createRestaurant = async (data: Partial<Restaurant>): Promise<Restaurant> => {
  try {
    const response = await api.post(`/database/rows/table/${TABLE_ID}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating restaurant:', error);
    throw error;
  }
};

export const updateRestaurant = async (id: number, data: Partial<Restaurant>): Promise<Restaurant> => {
  try {
    const response = await api.patch(`/database/rows/table/${TABLE_ID}/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating restaurant:', error);
    throw error;
  }
};

export const deleteRestaurant = async (id: number): Promise<void> => {
  try {
    await api.delete(`/database/rows/table/${TABLE_ID}/${id}/`);
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    throw error;
  }
};
>>>>>>> fix/cep-form-baserow
