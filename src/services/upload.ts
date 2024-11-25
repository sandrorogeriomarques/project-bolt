import axios from 'axios';

const API_URL = 'http://localhost:3001';

export async function uploadImage(file: File, type: 'avatar' | 'receipt'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    console.log('Iniciando upload de imagem:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadType: type
    });

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Adicionar timeout para evitar esperas indefinidas
      timeout: 10000 
    });

    console.log('Resposta do upload:', {
      path: response.data.path,
      status: response.status
    });

    // Normalizar o caminho: remover 'public' e substituir backslashes por forward slashes
    const normalizedPath = response.data.path
      .replace(/^public\\/, '') // Remove 'public\' do início
      .replace(/^public\//, '') // Remove 'public/' do início
      .replace(/\\/g, '/'); // Substituir backslashes por forward slashes

    console.log('Caminho normalizado:', normalizedPath);

    return normalizedPath;
  } catch (error) {
    console.error('Erro detalhado no upload de imagem:', error);
    
    // Se for um erro de axios, log detalhes específicos
    if (axios.isAxiosError(error)) {
      console.error('Detalhes do erro do servidor:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
    }

    throw new Error('Falha ao fazer upload do arquivo');
  }
}

export async function analyzeImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}
