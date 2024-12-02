interface APICall {
  timestamp: number;
  endpoint: string;
  cached: boolean;
  origin?: string;
  destination?: string;
}

class APITracker {
  private calls: {
    matrix: APICall[];
    directions: APICall[];
  } = {
    matrix: [],
    directions: []
  };

  addMatrixCall(origin: string, destination: string, cached: boolean) {
    this.calls.matrix.push({
      timestamp: Date.now(),
      endpoint: 'Distance Matrix API',
      cached,
      origin,
      destination
    });
  }

  addDirectionsCall(origin: string, destination: string, cached: boolean) {
    this.calls.directions.push({
      timestamp: Date.now(),
      endpoint: 'Directions API',
      cached,
      origin,
      destination
    });
  }

  getSummary(): string {
    const matrixCalls = this.calls.matrix.length;
    const matrixCached = this.calls.matrix.filter(call => call.cached).length;
    const matrixAPI = matrixCalls - matrixCached;

    const directionsCalls = this.calls.directions.length;
    const directionsCached = this.calls.directions.filter(call => call.cached).length;
    const directionsAPI = directionsCalls - directionsCached;

    return `
📊 Resumo de Chamadas de API:

🔷 Distance Matrix API:
  - Total de chamadas: ${matrixCalls}
  - Respostas do cache: ${matrixCached}
  - Chamadas à API: ${matrixAPI}
  - Taxa de cache hit: ${((matrixCached/matrixCalls) * 100).toFixed(1)}%

🔷 Directions API:
  - Total de chamadas: ${directionsCalls}
  - Respostas do cache: ${directionsCached}
  - Chamadas à API: ${directionsAPI}
  - Taxa de cache hit: ${((directionsCached/directionsCalls) * 100).toFixed(1)}%

💰 Economia Total: ${matrixCached + directionsCached} chamadas de API economizadas
`;
  }

  clearStats() {
    this.calls = {
      matrix: [],
      directions: []
    };
  }
}

export const apiTracker = new APITracker();
