import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, TempUser } from '../types';
import axios from 'axios';

interface BaserowUpdates {
  field_3016949?: string; // Nome
  field_3016950?: string; // Avatar
  field_3016951?: string; // WhatsApp
  field_3058061?: number; // Role (2286924 = admin, 2286925 = user)
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  tempUser: TempUser | null;
  setTempUser: (user: TempUser | null) => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
}

const BASEROW_API = 'https://api.baserow.io/api';
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN || '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';
const USERS_TABLE_ID = import.meta.env.VITE_USERS_TABLE_ID || '396313';

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

          const baserowUpdates: BaserowUpdates = {};

          // Mapear os campos de forma explícita
          if (updates.name !== undefined) {
            baserowUpdates.field_3016949 = updates.name;
          }
          if (updates.avatar !== undefined) {
            baserowUpdates.field_3016950 = updates.avatar;
          }
          if (updates.whatsapp !== undefined) {
            baserowUpdates.field_3016951 = updates.whatsapp;
          }
          if (updates.role !== undefined) {
            baserowUpdates.field_3058061 = updates.role === 'admin' ? 2286924 : 2286925;
          }

          console.log('Dados formatados para Baserow:', baserowUpdates);

          const baserowUrl = `${BASEROW_API}/database/rows/table/${USERS_TABLE_ID}/${currentUser.id}/`;
          console.log('URL do Baserow:', baserowUrl);

          const response = await axios.patch(
            baserowUrl,
            baserowUpdates,
            {
              headers: {
                'Authorization': `Token ${BASEROW_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('Resposta do Baserow:', {
            status: response.status,
            data: response.data,
            requestUrl: baserowUrl,
            requestData: baserowUpdates,
            requestHeaders: {
              'Authorization': 'Token [HIDDEN]',
              'Content-Type': 'application/json',
            }
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
              headers: error.response?.headers,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data,
                headers: {
                  ...error.config?.headers,
                  'Authorization': '[HIDDEN]'
                }
              }
            });
          }

          throw error;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, tempUser: null });
      }
    }),
    {
      name: 'user-storage',
    }
  )
);
