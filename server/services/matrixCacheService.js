const { BaserowAPI } = require('./baserow');

class MatrixCacheService {
  constructor() {
    this.baserow = new BaserowAPI();
    this.tableId = process.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID || '400157';
    this.marginOfError = 0.0001; // Margem de erro para comparação de coordenadas
  }

  async findRoute(origin, destination) {
    try {
      // Formatar coordenadas com 6 casas decimais
      const formatCoord = (coord) => parseFloat(coord).toFixed(6);
      const origin_lat = formatCoord(origin.lat);
      const origin_lng = formatCoord(origin.lng);
      const destination_lat = formatCoord(destination.lat);
      const destination_lng = formatCoord(destination.lng);

      console.log('Buscando rota no cache:', {
        origin: { lat: origin_lat, lng: origin_lng },
        destination: { lat: destination_lat, lng: destination_lng }
      });

      // Buscar rota no cache usando os filtros corretos do Baserow
      const params = {
        filter__origin_lat__equal: origin_lat,
        filter__origin_lng__equal: origin_lng,
        filter__destination_lat__equal: destination_lat,
        filter__destination_lng__equal: destination_lng,
        user_field_names: true
      };

      console.log('Parâmetros da busca:', params);

      const results = await this.baserow.select(this.tableId, { params });
      console.log('Resultados da busca:', results);
      
      if (results && results.length > 0) {
        const route = this._fromBaserowFormat(results[0]);
        console.log('✅ Rota encontrada no cache:', route);
        return route;
      }

      console.log('❌ Rota não encontrada no cache');
      return null;
    } catch (error) {
      console.error('Erro ao buscar rota no cache:', error);
      return null;
    }
  }

  async saveRoute(routeData) {
    try {
      console.log('Salvando rota no cache:', routeData);

      // Formatar números com 6 casas decimais
      const formatNumber = (num) => {
        const parsed = parseFloat(num);
        return isNaN(parsed) ? "0.000000" : parsed.toFixed(6);
      };

      const baserowData = {
        origin_address: String(routeData.origin_address || ''),
        origin_lat: formatNumber(routeData.origin_lat),
        origin_lng: formatNumber(routeData.origin_lng),
        destination_address: String(routeData.destination_address || ''),
        destination_lat: formatNumber(routeData.destination_lat),
        destination_lng: formatNumber(routeData.destination_lng),
        distance: Number(routeData.distance || 0),
        duration: Number(routeData.duration || 0),
        points: JSON.stringify(routeData.points || [])
      };

      console.log('Dados formatados para o Baserow:', baserowData);

      const result = await this.baserow.create(this.tableId, baserowData);
      console.log('✅ Rota salva no cache:', result);

      return this._fromBaserowFormat(result);
    } catch (error) {
      console.error('❌ Erro ao salvar no cache:', error);
      throw error;
    }
  }

  async cleanupOldRoutes(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const filters = {
        filter__last_used__date_before: cutoffDate.toISOString()
      };

      const oldRoutes = await this.baserow.select(this.tableId, { params: filters });
      
      for (const route of oldRoutes) {
        await this.baserow.delete(this.tableId, route.id);
      }

      return true;
    } catch (error) {
      console.error('Erro ao limpar rotas antigas:', error);
      return false;
    }
  }

  _fromBaserowFormat(data) {
    if (!data) return null;
    
    try {
      return {
        id: data.id,
        origin_address: data.origin_address || '',
        origin_lat: parseFloat(data.origin_lat) || 0,
        origin_lng: parseFloat(data.origin_lng) || 0,
        destination_address: data.destination_address || '',
        destination_lat: parseFloat(data.destination_lat) || 0,
        destination_lng: parseFloat(data.destination_lng) || 0,
        distance: parseInt(data.distance) || 0,
        duration: parseInt(data.duration) || 0,
        points: data.points ? JSON.parse(data.points) : [],
        created_at: data.created_at,
        last_used: data.last_used
      };
    } catch (error) {
      console.error('Erro ao converter dados do Baserow:', error);
      return null;
    }
  }
}

module.exports = new MatrixCacheService();
