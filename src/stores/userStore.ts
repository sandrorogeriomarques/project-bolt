import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import axios from 'axios';

interface BaserowUpdates {
  Nome?: string;
  Avatar?: string;
  WhatsApp?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  tempUser: Partial<User> | null;
  setTempUser: (user: Partial<User> | null) => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      tempUser: null,
      setTempUser: (user) => set({ tempUser: user }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser?.id) return;

        try {
          console.warn('DETAILED USER UPDATE ATTEMPT:', {
            currentUserId: currentUser.id,
            updates: JSON.stringify(updates),
            currentUserState: JSON.stringify(currentUser)
          });

          const baserowUpdates: BaserowUpdates = {
            Nome: updates.name,
            Avatar: updates.avatar ? updates.avatar.replace(/^\/+/, '') : undefined,
            WhatsApp: updates.whatsapp
          };

          // Filtrar campos undefined de uma maneira type-safe
          const filteredUpdates: BaserowUpdates = {};
          (Object.keys(baserowUpdates) as Array<keyof BaserowUpdates>).forEach(key => {
            if (baserowUpdates[key] !== undefined) {
              filteredUpdates[key] = baserowUpdates[key];
            }
          });

          console.log('Dados formatados para Baserow:', filteredUpdates);

          const response = await axios.patch(
            `https://api.baserow.io/api/database/rows/table/396313/${currentUser.id}/?user_field_names=true`,
            filteredUpdates,
            {
              headers: {
                'Authorization': 'Token 0lsB6U6zcpKt8W4f9pydlsvJnibOASeI',
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('Resposta do Baserow:', {
            status: response.status,
            data: response.data
          });

          const updatedUser = {
            ...currentUser,
            ...updates,
          };

          console.log('Usuário atualizado localmente:', updatedUser);

          set({ user: updatedUser });
        } catch (error) {
          console.error('Erro detalhado ao atualizar usuário:', error);
          
          if (axios.isAxiosError(error)) {
            console.error('Detalhes do erro do Baserow:', {
              response: error.response?.data,
              status: error.response?.status,
              headers: error.response?.headers
            });
          }
          
          throw error;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, tempUser: null });
        localStorage.removeItem('user-storage');
      },
    }),
    {
      name: 'user-storage',
      partialize: (state: UserState) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
