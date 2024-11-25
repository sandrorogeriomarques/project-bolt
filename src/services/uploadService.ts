import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const UPLOAD_DIR = '/uploads/avatars';

export const uploadService = {
  async uploadAvatar(file: File): Promise<string> {
    try {
      console.log('Iniciando upload do avatar:', file.name);

      // Criar um nome único para o arquivo usando UUID e extensão original
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${UPLOAD_DIR}/${fileName}`;
      
      console.log('Caminho do arquivo:', filePath);

      // Converter o arquivo para FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', filePath);

      console.log('Enviando requisição para o servidor...');
      
      // Enviar o arquivo para o servidor
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Resposta do servidor:', response.data);

      // Retornar o caminho relativo da imagem
      return response.data.url;
    } catch (error) {
      console.error('Erro detalhado ao fazer upload do avatar:', error);
      if (axios.isAxiosError(error)) {
        console.error('Resposta do servidor:', error.response?.data);
      }
      throw new Error('Falha ao fazer upload do avatar');
    }
  }
};
