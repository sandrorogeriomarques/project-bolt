import { Restaurant } from '../types';
import { baserowApi } from './baserowApi';

const RESTAURANTS_TABLE_ID = import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID || '396313';

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
    console.error('Erro ao excluir restaurante:', error);
    throw error;
  }
}
