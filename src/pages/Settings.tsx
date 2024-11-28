import { useState, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { toast } from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { uploadImage } from '../services/upload';
import axios from 'axios'; // Import axios
import { getAvatarUrl } from '../utils/getAvatarUrl';

export function Settings() {
  const { user, updateUser } = useUserStore();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      await updateUser({ name });
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao atualizar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsLoading(true);
      
      // Extensive logging and validation
      console.warn('AVATAR UPLOAD PROCESS:', {
        fileDetails: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        currentUser: {
          id: user.id,
          name: user.name,
          currentAvatar: user.avatar
        }
      });
      
      // Validate file size and type
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.');
        return;
      }
      
      // Upload do arquivo para o servidor
      const avatarPath = await uploadImage(file, 'avatar');
      
      console.warn('AVATAR PATH RECEIVED:', avatarPath);
      
      // Garantir que o caminho do avatar esteja correto
      const normalizedAvatarPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
      
      // Atualiza o usuário no Baserow com o caminho do avatar
      await updateUser({ 
        avatar: normalizedAvatarPath,
        // Remover a / inicial para o Baserow
        field_3040202: normalizedAvatarPath.replace(/^\/+/, '')
      });
      
      console.warn('USER UPDATE COMPLETED:', {
        userId: user.id,
        newAvatarPath: normalizedAvatarPath,
        baserowPath: normalizedAvatarPath.replace(/^\/+/, '')
      });
      
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      // Log de erro mais detalhado
      console.error('COMPLETE AVATAR UPDATE ERROR:', {
        error: error instanceof Error ? error.message : error,
        userId: user?.id,
        userName: user?.name
      });
      
      // Se for um erro de axios, log a resposta do servidor
      if (axios.isAxiosError(error)) {
        console.error('SERVER ERROR DETAILS:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      
      toast.error('Erro ao atualizar avatar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* WhatsApp (somente leitura) */}
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
              WhatsApp
            </label>
            <input
              type="text"
              id="whatsapp"
              value={user?.whatsapp || ''}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              O WhatsApp não pode ser alterado
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}