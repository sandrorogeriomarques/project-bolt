import { baserowApi } from './baserowApi';

const MATRIX_CACHE_TABLE_ID = import.meta.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID || '400157';

interface MatrixCacheEntry {
  id?: number;
  field_3040301: string; // origin
  field_3040302: string; // destination
  field_3040303: number; // distance
  field_3040304: number; // duration
  field_3040305: number; // timestamp
}

export const matrixCacheService = {
  async getCachedDistance(origin: string, destination: string): Promise<MatrixCacheEntry | null> {
    try {
      const response = await baserowApi.get(`/database/rows/table/${MATRIX_CACHE_TABLE_ID}/`, {
        params: {
          'filter__field_3040301__equal': origin,
          'filter__field_3040302__equal': destination
        }
      });

      if (response.data.count > 0) {
        const entry = response.data.results[0];
        // Verificar se o cache não está muito antigo (24 horas)
        const cacheAge = Date.now() - entry.field_3040305;
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return entry;
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cache de distância:', error);
      return null;
    }
  },

  async cacheDistance(origin: string, destination: string, distance: number, duration: number): Promise<void> {
    try {
      const entry: MatrixCacheEntry = {
        field_3040301: origin,
        field_3040302: destination,
        field_3040303: distance,
        field_3040304: duration,
        field_3040305: Date.now()
      };

      await baserowApi.post(`/database/rows/table/${MATRIX_CACHE_TABLE_ID}/`, entry);
    } catch (error) {
      console.error('Erro ao salvar cache de distância:', error);
    }
  }
};
