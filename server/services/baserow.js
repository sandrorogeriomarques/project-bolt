const axios = require('axios');

class BaserowAPI {
  constructor() {
    console.log('=== INICIANDO BASEROW API ===');
    console.log('Variáveis de ambiente:', {
      baseURL: process.env.VITE_BASEROW_API_URL,
      token: process.env.VITE_BASEROW_TOKEN ? 'presente' : 'ausente'
    });

    this.api = axios.create({
      baseURL: process.env.VITE_BASEROW_API_URL || 'https://api.baserow.io/api',
      headers: {
        'Authorization': `Token ${process.env.VITE_BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async select(tableId, options = {}) {
    try {
      console.log('=== BUSCANDO NO BASEROW ===');
      console.log('TableId:', tableId);
      console.log('Opções:', options);

      const params = {
        user_field_names: true,
        ...(options.params || {})
      };
      
      const response = await this.api.get(`/database/rows/table/${tableId}/`, { params });
      console.log('Resposta do Baserow:', response.data);
      return response.data.results;
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error.response?.data || error);
      throw error;
    }
  }

  async create(tableId, data) {
    try {
      console.log('=== CRIANDO REGISTRO NO BASEROW ===');
      console.log('TableId:', tableId);
      console.log('Dados:', data);

      // Garantir que todos os campos necessários estejam presentes e com o tipo correto
      const formattedData = {
        origin_address: String(data.origin_address || ''),
        origin_lat: String(data.origin_lat || '0.000000'),
        origin_lng: String(data.origin_lng || '0.000000'),
        destination_address: String(data.destination_address || ''),
        destination_lat: String(data.destination_lat || '0.000000'),
        destination_lng: String(data.destination_lng || '0.000000'),
        distance: Number(data.distance || 0),
        duration: Number(data.duration || 0),
        points: String(data.points || '[]')
      };

      console.log('Dados formatados:', formattedData);

      const response = await this.api.post(
        `/database/rows/table/${tableId}/?user_field_names=true`,
        formattedData
      );
      
      console.log('✅ Registro criado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar registro:', error.response?.data || error);
      throw error;
    }
  }

  async update(tableId, rowId, data) {
    try {
      console.log('=== ATUALIZANDO REGISTRO NO BASEROW ===');
      console.log('TableId:', tableId);
      console.log('RowId:', rowId);
      console.log('Dados:', data);

      const response = await this.api.patch(`/database/rows/table/${tableId}/${rowId}/?user_field_names=true`, data);
      
      console.log('✅ Registro atualizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar registro:', error.response?.data || error);
      throw error;
    }
  }

  async delete(tableId, rowId) {
    try {
      console.log('=== REMOVENDO REGISTRO DO BASEROW ===');
      console.log('TableId:', tableId);
      console.log('RowId:', rowId);

      await this.api.delete(`/database/rows/table/${tableId}/${rowId}/`);
      console.log('✅ Registro removido com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover registro:', error.response?.data || error);
      throw error;
    }
  }

  async count(tableId, options = {}) {
    try {
      console.log('=== CONTANDO REGISTROS NO BASEROW ===');
      console.log('TableId:', tableId);
      console.log('Opções:', options);

      const response = await this.api.get(`/database/rows/table/${tableId}/count/`, {
        params: {
          user_field_names: true,
          ...(options.params || {})
        }
      });
      
      return response.data.count;
    } catch (error) {
      console.error('❌ Erro ao contar registros:', error.response?.data || error);
      throw error;
    }
  }
}

module.exports = { BaserowAPI };
