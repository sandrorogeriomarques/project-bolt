import React from 'react';
import { Map } from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';

export function RouteCard() {
  const deliveryPoints = useRouteStore((state) => state.deliveryPoints);

  const handleViewRoute = () => {
    // Construir a URL do Google Maps com múltiplos pontos
    const waypoints = deliveryPoints.map(point => {
      const address = `${point.street}, ${point.number} - ${point.neighborhood}, ${point.city}`;
      return encodeURIComponent(address);
    });

    // Se tivermos pontos, criar a URL com origem, destino e waypoints
    if (waypoints.length > 0) {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const middlePoints = waypoints.slice(1, -1);
      
      let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      
      if (middlePoints.length > 0) {
        mapsUrl += `&waypoints=${middlePoints.join('|')}`;
      }

      window.open(mapsUrl, '_blank');
    }
  };

  if (deliveryPoints.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Rota de Entrega
          </h2>
          <p className="text-gray-600">
            {deliveryPoints.length} {deliveryPoints.length === 1 ? 'ponto' : 'pontos'} de entrega
          </p>
        </div>
      </div>
      
      <button
        onClick={handleViewRoute}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <Map className="w-5 h-5" />
        Ver Rota Completa
      </button>
    </div>
  );
}
