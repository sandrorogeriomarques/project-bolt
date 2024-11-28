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
