import axios from 'axios';

const BASEROW_API_URL = import.meta.env.VITE_BASEROW_API_URL || 'https://api.baserow.io/api';
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN || '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';

// Criar instância do axios com configurações base
export const baserowApi = axios.create({
  baseURL: BASEROW_API_URL,
  headers: {
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Adicionar interceptor para garantir que o token está presente
baserowApi.interceptors.request.use(config => {
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Token ${BASEROW_TOKEN}`;
  }
  return config;
});

// Adicionar interceptor para log de erros
baserowApi.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error)) {
      console.error('Erro na chamada ao Baserow:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        requestData: error.config?.data // Adicionando os dados enviados na requisição
      });
    }
    return Promise.reject(error);
  }
);
