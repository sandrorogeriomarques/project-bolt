const { BaserowAPI } = require('./baserow');
require('dotenv').config();

class MatrixCache {
  constructor() {
    this.baserow = new BaserowAPI();
    this.tableId = process.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID;
    this.marginOfError = 0.0001;
    console.log('MatrixCache iniciado com tableId:', this.tableId);
  }

  // Converte os dados para o formato do Baserow
  _toBaserowFormat(data) {
    const baserowData = {
      "field_3050901": data.origin_address || '',
      "field_3050902": parseFloat(data.origin_lat || 0),
      "field_3050910": parseFloat(data.origin_lng || 0),
      "field_3050911": data.destination_address || '',
      "field_3050913": parseFloat(data.destination_lat || 0),
      "field_3050915": parseFloat(data.destination_lng || 0),
      "field_3050916": parseInt(data.distance || 0),
      "field_3050918": parseInt(data.duration || 0),
      "field_3050919": JSON.stringify(data.points || [])
    };
    console.log('Dados convertidos para formato Baserow:', JSON.stringify(baserowData, null, 2));
    return baserowData;
  }

  // Converte os dados do Baserow para o formato da API
  _fromBaserowFormat(data) {
    if (!data) return null;
    
    try {
      return {
        origin_address: data.field_3050901 || '',
        origin_lat: data.field_3050902 ? parseFloat(data.field_3050902) : null,
        origin_lng: data.field_3050910 ? parseFloat(data.field_3050910) : null,
        destination_address: data.field_3050911 || '',
        destination_lat: data.field_3050913 ? parseFloat(data.field_3050913) : null,
        destination_lng: data.field_3050915 ? parseFloat(data.field_3050915) : null,
        distance: data.field_3050916 ? parseFloat(data.field_3050916) : null,
        duration: data.field_3050918 ? parseFloat(data.field_3050918) : null,
        points: data.field_3050919 ? JSON.parse(data.field_3050919) : [],
        created_at: data.field_3050920,
        last_used: data.field_3050921
      };
    } catch (error) {
      console.error('Erro ao converter dados do Baserow:', error);
      return null;
    }
  }

  // Busca uma rota no cache
  async find(origin_lat, origin_lng, destination_lat, destination_lng) {
    try {
      console.log('Buscando rota com coordenadas:', {
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng
      });

      // Criando filtros para buscar coordenadas dentro da margem de erro
      const filters = {
        filter__field_3050902__lower_than_or_equal: parseFloat(origin_lat) + this.marginOfError,
        filter__field_3050902__higher_than_or_equal: parseFloat(origin_lat) - this.marginOfError,
        filter__field_3050910__lower_than_or_equal: parseFloat(origin_lng) + this.marginOfError,
        filter__field_3050910__higher_than_or_equal: parseFloat(origin_lng) - this.marginOfError,
        filter__field_3050913__lower_than_or_equal: parseFloat(destination_lat) + this.marginOfError,
        filter__field_3050913__higher_than_or_equal: parseFloat(destination_lat) - this.marginOfError,
        filter__field_3050915__lower_than_or_equal: parseFloat(destination_lng) + this.marginOfError,
        filter__field_3050915__higher_than_or_equal: parseFloat(destination_lng) - this.marginOfError
      };

      console.log('Filtros Baserow:', JSON.stringify(filters, null, 2));

      const results = await this.baserow.select(this.tableId, { params: filters });
      console.log('Resultados encontrados:', results.length);
      
      if (results && results.length > 0) {
        console.log('Dados brutos do Baserow:', JSON.stringify(results[0], null, 2));
        const data = this._fromBaserowFormat(results[0]);
        console.log('Dados convertidos do formato Baserow:', JSON.stringify(data, null, 2));
        console.log('Rota encontrada no cache!');
        
        // Não precisamos mais atualizar o last_used manualmente
        // O Baserow fará isso automaticamente
        
        return data;
      }
      
      console.log('Nenhuma rota encontrada no cache');
      return null;
    } catch (error) {
      console.error('Erro ao buscar no cache:', error);
      return null;
    }
  }

  // Salva uma rota no cache
  async save(data) {
    try {
      console.log('Salvando rota no cache:', JSON.stringify(data, null, 2));
      const baserowData = this._toBaserowFormat(data);
      console.log('Dados formatados para Baserow:', JSON.stringify(baserowData, null, 2));
      const result = await this.baserow.create(this.tableId, baserowData);
      console.log('Resposta do Baserow:', JSON.stringify(result, null, 2));
      return this._fromBaserowFormat(result);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error.response?.data || error);
      throw new Error('Erro ao salvar cache');
    }
  }

  // Remove rotas antigas do cache (mais de 30 dias)
  async cleanup() {
    try {
      console.log('Iniciando limpeza do cache...');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const results = await this.baserow.select(this.tableId);
      console.log(`Encontrados ${results.length} registros para verificar`);
      
      for (const result of results) {
        const lastUsed = new Date(result.field_3050921);
        if (lastUsed < thirtyDaysAgo) {
          console.log(`Removendo registro antigo: ${result.id}`);
          await this.baserow.delete(this.tableId, result.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  }
}

module.exports = { MatrixCache };
