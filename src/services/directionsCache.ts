interface DirectionsCacheEntry {
  staticData: {
    points: Array<[number, number]>;
    distance: number;
    addresses: {
      start: string;
      end: string;
    };
  };
  timestamp: number;
}

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos
const directionsCache = new Map<string, DirectionsCacheEntry>();

export const directionsService = {
  getCacheKey(origin: string, destination: string): string {
    return `${origin}|${destination}`;
  },

  async getFromCache(origin: string, destination: string): Promise<DirectionsCacheEntry | null> {
    const key = this.getCacheKey(origin, destination);
    const entry = directionsCache.get(key);
    
    if (!entry) {
      console.log('❌ Cache miss para rota:', { origin, destination });
      return null;
    }
    
    // Verifica se o cache expirou
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      console.log('⌛ Cache expirado para rota:', { origin, destination });
      directionsCache.delete(key);
      return null;
    }
    
    console.log('✅ Cache hit para rota:', { origin, destination });
    return entry;
  },

  async saveToCache(
    origin: string, 
    destination: string, 
    data: DirectionsCacheEntry['staticData']
  ): Promise<void> {
    const key = this.getCacheKey(origin, destination);
    directionsCache.set(key, {
      staticData: data,
      timestamp: Date.now()
    });
    console.log('💾 Rota salva no cache:', { origin, destination });
  },

  clearCache(): void {
    directionsCache.clear();
    console.log('🧹 Cache limpo');
  }
};
