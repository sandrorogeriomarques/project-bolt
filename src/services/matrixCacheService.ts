import { baserowApi } from './baserowApi';

const MATRIX_CACHE_TABLE_ID = import.meta.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID || '400157';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const MARGIN_OF_ERROR = 0.0001; // Mesma margem de erro do servidor

// Cache em memória para reduzir chamadas à API
const memoryCache: Map<string, {
  distance: number;
  duration: number;
  timestamp: number;
}> = new Map();

interface MatrixCacheEntry {
  id?: number;
  field_3050902: string;  // origin_lat
  field_3050910: string;  // origin_lng
  field_3050913: string;  // destination_lat
  field_3050915: string;  // destination_lng
  field_3050916: number;  // distance
  field_3050918: number;  // duration
}

const getCacheKey = (originLat: number, originLng: number, destLat: number, destLng: number): string => {
  return `${originLat}|${originLng}|${destLat}|${destLng}`;
};

const isValidCoordinate = (coord: string): boolean => {
  const [lat, lng] = coord.split(',').map(Number);
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

const formatCoord = (coord: number) => coord.toFixed(7);

export const matrixCacheService = {
  async getCachedDistance(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      // Extrair lat/lng das strings ou objetos
      let originLat: number, originLng: number, destLat: number, destLng: number;

      if (typeof origin === 'string') {
        const [lat, lng] = origin.split(',').map(Number);
        originLat = lat;
        originLng = lng;
      } else {
        originLat = origin.lat;
        originLng = origin.lng;
      }

      if (typeof destination === 'string') {
        const [lat, lng] = destination.split(',').map(Number);
        destLat = lat;
        destLng = lng;
      } else {
        destLat = destination.lat;
        destLng = destination.lng;
      }

      if (
        isNaN(originLat) || isNaN(originLng) || 
        isNaN(destLat) || isNaN(destLng)
      ) {
        console.error('Coordenadas inválidas:', { origin, destination });
        return null;
      }

      // Formatar coordenadas com 7 casas decimais
      const originLatStr = formatCoord(originLat);
      const originLngStr = formatCoord(originLng);
      const destLatStr = formatCoord(destLat);
      const destLngStr = formatCoord(destLng);

      console.log('🔍 Buscando no cache com coordenadas:', {
        originLat: originLatStr,
        originLng: originLngStr,
        destLat: destLatStr,
        destLng: destLngStr
      });

      // Verificar cache em memória primeiro
      const cacheKey = getCacheKey(originLat, originLng, destLat, destLng);
      const memoryCacheEntry = memoryCache.get(cacheKey);
      
      if (memoryCacheEntry && Date.now() - memoryCacheEntry.timestamp < CACHE_DURATION) {
        console.log('✅ Cache em memória encontrado:', memoryCacheEntry);
        return {
          distance: memoryCacheEntry.distance,
          duration: memoryCacheEntry.duration
        };
      }

      // Se não estiver em memória, buscar do Baserow
      const response = await baserowApi.get(
        `/database/rows/table/${MATRIX_CACHE_TABLE_ID}/`,
        {
          params: {
            user_field_names: false,
            filter__field_3050902__equal: originLatStr,
            filter__field_3050910__equal: originLngStr,
            filter__field_3050913__equal: destLatStr,
            filter__field_3050915__equal: destLngStr,
          },
        }
      );

      const results = response.data.results;

      if (results && results.length > 0) {
        const cachedResult = results[0];
        console.log('✅ Cache encontrado:', cachedResult);
        
        // Salvar em memória também
        memoryCache.set(cacheKey, {
          distance: Number(cachedResult.field_3050916),
          duration: Number(cachedResult.field_3050918),
          timestamp: Date.now()
        });

        return {
          distance: Number(cachedResult.field_3050916),
          duration: Number(cachedResult.field_3050918),
        };
      }

      console.log('❌ Cache miss - Coordenadas não encontradas no Baserow');
      return null;
    } catch (error) {
      console.error('Erro ao buscar do cache:', error);
      return null;
    }
  },

  async cacheDistance(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number },
    distance: number,
    duration: number
  ): Promise<void> {
    try {
      // Extrair lat/lng das strings ou objetos
      let originLat: number, originLng: number, destLat: number, destLng: number;

      if (typeof origin === 'string') {
        const [lat, lng] = origin.split(',').map(Number);
        originLat = lat;
        originLng = lng;
      } else {
        originLat = origin.lat;
        originLng = origin.lng;
      }

      if (typeof destination === 'string') {
        const [lat, lng] = destination.split(',').map(Number);
        destLat = lat;
        destLng = lng;
      } else {
        destLat = destination.lat;
        destLng = destination.lng;
      }

      if (
        isNaN(originLat) || isNaN(originLng) || 
        isNaN(destLat) || isNaN(destLng)
      ) {
        throw new Error('Coordenadas inválidas');
      }

      // Preparar dados para o Baserow - formatando números com precisão fixa
      const item = {
        field_3050902: formatCoord(originLat),
        field_3050910: formatCoord(originLng),
        field_3050913: formatCoord(destLat),
        field_3050915: formatCoord(destLng),
        field_3050916: Math.round(distance),
        field_3050918: Math.round(duration),
      };

      console.log('Salvando no cache do Baserow:', item);

      // Salvar no cache em memória primeiro
      const cacheKey = getCacheKey(originLat, originLng, destLat, destLng);
      memoryCache.set(cacheKey, {
        distance: Math.round(distance),
        duration: Math.round(duration),
        timestamp: Date.now()
      });

      // Tentar salvar no Baserow
      const response = await baserowApi.post(`/database/rows/table/${MATRIX_CACHE_TABLE_ID}/`, {
        user_field_names: false,
        ...item
      });

      console.log('✅ Salvo no Baserow com sucesso:', response.data);
      
    } catch (error) {
      console.error('Erro ao salvar cache de distância:', error);
      if (error.response?.data) {
        console.error('Detalhes do erro:', error.response.data);
        console.error('Detalhes completos:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });
      }
    }
  },

  clearMemoryCache(): void {
    memoryCache.clear();
  }
};
