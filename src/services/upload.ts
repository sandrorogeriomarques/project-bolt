import axios from 'axios';
import { config } from '../config';

const API_URL = config.apiUrl;

export async function uploadImage(file: File, type: 'avatar' | 'receipt'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    console.warn('UPLOAD_START:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadType: type,
      apiUrl: API_URL
    });

    // Validar se o servidor está acessível
    try {
      await axios.get(`${API_URL}/`, { timeout: 2000 });
    } catch (error) {
      console.error('UPLOAD_SERVER_CHECK_FAILED:', error);
      throw new Error('Servidor de upload não está acessível. Verifique se o servidor está rodando.');
    }

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Aumentar timeout para 30 segundos
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    console.warn('UPLOAD_RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });

    if (!response.data?.path) {
      console.error('UPLOAD_INVALID_RESPONSE:', response.data);
      throw new Error('Resposta inválida do servidor de upload');
    }

    // Normalizar o caminho: remover 'public' e substituir backslashes por forward slashes
    const normalizedPath = response.data.path
      .replace(/^public\\/, '') // Remove 'public\' do início
      .replace(/^public\//, '') // Remove 'public/' do início
      .replace(/\\/g, '/'); // Substituir backslashes por forward slashes

    console.warn('UPLOAD_SUCCESS:', {
      originalPath: response.data.path,
      normalizedPath: normalizedPath
    });

    return normalizedPath;
  } catch (error) {
    console.error('UPLOAD_ERROR:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('UPLOAD_SERVER_ERROR:', {
        message: error.message,
        code: error.code,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo limite de upload excedido. Tente novamente.');
      }
      
      if (error.response?.status === 413) {
        throw new Error('Arquivo muito grande. Máximo permitido é 5MB.');
      }
    }
    
    throw error;
  }
}

export async function analyzeImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.text;
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    throw error;
  }
}
