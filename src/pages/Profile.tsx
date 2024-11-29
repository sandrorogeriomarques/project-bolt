import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getAvatarUrl } from '../utils/getAvatarUrl';
import { getRestaurant } from '../services/restaurantService';
import { getUserPreferences } from '../services/userPreferencesService';
import { Restaurant } from '../types';

export function Profile() {
  const user = useUserStore((state) => state.user);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        try {
          console.log('Loading data for user:', user.id);
          // Carregar preferências do usuário
          const preferences = await getUserPreferences(user.id);
          console.log('User preferences:', preferences);
          
          if (preferences?.field_3040270) {
            console.log('Selected restaurant ID:', preferences.field_3040270);
            // Carregar restaurante diretamente pelo ID
            const userRestaurant = await getRestaurant(preferences.field_3040270);
            console.log('Restaurant data:', userRestaurant);
            
            if (userRestaurant) {
              setRestaurant(userRestaurant);
            }
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    loadData();
  }, [user?.id]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          {user.avatar ? (
            <img
              src={getAvatarUrl(user.avatar)}
              alt="Avatar"
              className="w-32 h-32 rounded-full mx-auto object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
              <span className="text-4xl text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mt-4">{user.name}</h1>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nome</p>
                <p className="mt-1 text-lg text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                <p className="mt-1 text-lg text-gray-900">{user.whatsapp}</p>
              </div>
              {restaurant && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Restaurante</p>
                  <p className="mt-1 text-lg text-gray-900">{restaurant.field_3040210}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}