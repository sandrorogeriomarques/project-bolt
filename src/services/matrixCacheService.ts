import { baserowApi } from './baserowApi';

const MATRIX_CACHE_TABLE_ID = import.meta.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID || '400157';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

// Cache em memória para reduzir chamadas à API
const memoryCache: Map<string, {
  data: MatrixCacheEntry;
  timestamp: number;
}> = new Map();

interface MatrixCacheEntry {
  id?: number;
  field_3040301: string; // origin
  field_3040302: string; // destination
  field_3040303: number; // distance
  field_3040304: number; // duration
  field_3040305: number; // timestamp
}

const getCacheKey = (origin: string, destination: string): string => {
  return `${origin}|${destination}`;
};

const isValidCoordinate = (coord: string): boolean => {
  const [lat, lng] = coord.split(',').map(Number);
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

export const matrixCacheService = {
  async getCachedDistance(origin: string, destination: string): Promise<MatrixCacheEntry | null> {
    try {
      // Validar coordenadas
      if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
        console.error('Coordenadas inválidas:', { origin, destination });
        return null;
      }

      // Verificar cache em memória primeiro
      const cacheKey = getCacheKey(origin, destination);
      const memoryCacheEntry = memoryCache.get(cacheKey);
      
      if (memoryCacheEntry && (Date.now() - memoryCacheEntry.timestamp) < CACHE_DURATION) {
        return memoryCacheEntry.data;
      }

      // Se não estiver em memória, buscar do Baserow
      const params = new URLSearchParams({
        'filter__field_3040301__equal': origin,
        'filter__field_3040302__equal': destination
      });

      const response = await baserowApi.get(
        `/database/rows/table/${MATRIX_CACHE_TABLE_ID}/?${params.toString()}`
      );

      if (response.data.count > 0) {
        const entry = response.data.results[0];
        const cacheAge = Date.now() - entry.field_3040305;
        
        if (cacheAge < CACHE_DURATION) {
          // Atualizar cache em memória
          memoryCache.set(cacheKey, {
            data: entry,
            timestamp: Date.now()
          });
          return entry;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar cache de distância:', error);
      // Em caso de erro, tentar usar cache em memória mesmo que esteja expirado
      const memoryCacheEntry = memoryCache.get(getCacheKey(origin, destination));
      return memoryCacheEntry?.data || null;
    }
  },

  async cacheDistance(origin: string, destination: string, distance: number, duration: number): Promise<void> {
    try {
      // Validar coordenadas
      if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
        console.error('Coordenadas inválidas para cache:', { origin, destination });
        return;
      }

      const entry: MatrixCacheEntry = {
        field_3040301: origin,
        field_3040302: destination,
        field_3040303: distance,
        field_3040304: duration,
        field_3040305: Date.now()
      };

      // Atualizar cache em memória primeiro
      const cacheKey = getCacheKey(origin, destination);
      memoryCache.set(cacheKey, {
        data: entry,
        timestamp: Date.now()
      });

      // Tentar salvar no Baserow de forma assíncrona
      await baserowApi.post(`/database/rows/table/${MATRIX_CACHE_TABLE_ID}/`, entry);
    } catch (error) {
      console.error('Erro ao salvar cache de distância:', error);
      // Continuar usando o cache em memória mesmo se falhar ao salvar no Baserow
    }
  },

  clearMemoryCache(): void {
    memoryCache.clear();
  }
};
