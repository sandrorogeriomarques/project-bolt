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
  field_3050901: string;  // origin_address
  field_3050902: number;  // origin_lat
  field_3050910: number;  // origin_lng
  field_3050911: string;  // destination_address
  field_3050913: number;  // destination_lat
  field_3050915: number;  // destination_lng
  field_3050916: number;  // distance
  field_3050918: number;  // duration
  field_3050919: string;  // points
  field_3050920?: string; // created_at
  field_3050921?: string; // last_used
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
      const [originLat, originLng] = origin.split(',').map(Number);
      const [destLat, destLng] = destination.split(',').map(Number);

      const params = new URLSearchParams({
        'filter__field_3050902__equal': originLat.toString(),
        'filter__field_3050910__equal': originLng.toString(),
        'filter__field_3050913__equal': destLat.toString(),
        'filter__field_3050915__equal': destLng.toString()
      });

      const response = await baserowApi.get(
        `/database/rows/table/${MATRIX_CACHE_TABLE_ID}/?${params.toString()}`
      );

      if (response.data.count > 0) {
        const entry = response.data.results[0];
        const lastUsed = new Date(entry.field_3050921);
        const cacheAge = Date.now() - lastUsed.getTime();
        
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

  async cacheDistance(origin: string, destination: string, distance: number, duration: number, points: string = ''): Promise<void> {
    try {
      // Validar coordenadas
      if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
        console.error('Coordenadas inválidas para cache:', { origin, destination });
        return;
      }

      const [originLat, originLng] = origin.split(',').map(Number);
      const [destLat, destLng] = destination.split(',').map(Number);

      const now = new Date().toISOString();
      const entry: MatrixCacheEntry = {
        field_3050901: origin,  // origin_address (usando a string completa de coordenadas como endereço por enquanto)
        field_3050902: originLat,
        field_3050910: originLng,
        field_3050911: destination,  // destination_address (usando a string completa de coordenadas como endereço por enquanto)
        field_3050913: destLat,
        field_3050915: destLng,
        field_3050916: distance,
        field_3050918: duration,
        field_3050919: points,
        field_3050920: now,  // created_at
        field_3050921: now   // last_used
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
