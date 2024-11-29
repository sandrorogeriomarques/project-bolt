import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import polyline from '@mapbox/polyline';

// Importar ícones do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Corrigir o problema dos ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface DeliveryMapProps {
  restaurantAddress: string;
  deliveryPoints: Array<{
    address: string;
    customerName: string;
    id: string;
    lat: number;
    lng: number;
  }>;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

export function DeliveryMap({ restaurantAddress, deliveryPoints }: DeliveryMapProps) {
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destinations, setDestinations] = useState<RoutePoint[]>([]);
  const [routes, setRoutes] = useState<Array<Array<[number, number]>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markerRefs = useRef<Array<L.Marker>>([]);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Remove custom Axios instance and use relative paths
  const api = axios;

  // Log inicial para verificar a chave da API
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('API Key:', GOOGLE_MAPS_API_KEY);
    console.log('import.meta.env:', import.meta.env);
    console.log('================');
  }, []);

  const geocodeAddress = async (address: string) => {
    try {
      console.log('Geocodificando endereço:', address);
      
      // Adicionar 'Brasil' ao endereço para melhorar a precisão
      const fullAddress = `${address}, Brasil`;
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      console.log('Resposta da API de Geocodificação:', response.data);

      if (response.data.status === 'ZERO_RESULTS') {
        throw new Error(`Endereço não encontrado: ${address}`);
      }

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        console.log('Coordenadas encontradas para', address, ':', location);
        return {
          lat: location.lat,
          lng: location.lng
        };
      }

      throw new Error(`Erro na geocodificação: ${response.data.status} - ${address}`);
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      throw error;
    }
  };

  const getDirections = async (origin: RoutePoint, destination: RoutePoint) => {
    try {
      console.log('Obtendo direções para:', { origin, destination });
      
      // Fazer a requisição através do nosso servidor backend
      const response = await api.post('/api/directions', {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: GOOGLE_MAPS_API_KEY
      });

      if (response.data.status === 'OK' && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        console.log('Polyline da rota:', route.overview_polyline.points);
        
        // Decodificar o polyline usando a biblioteca @mapbox/polyline
        const decodedPoints = polyline.decode(route.overview_polyline.points);
        
        // Converter para o formato que o Leaflet espera [lat, lng]
        const points = decodedPoints.map(point => [point[0], point[1]] as [number, number]);
        
        console.log('Pontos decodificados (detalhado):', JSON.stringify(points.slice(0, 3), null, 2));
        return points;
      }

      throw new Error('Não foi possível obter a rota');
    } catch (error) {
      console.error('Erro ao obter direções:', error);
      throw error;
    }
  };

  const calculateRoute = async () => {
    try {
      setLoading(true);
      setError(null);
      const newRoutes: Array<Array<[number, number]>> = [];

      // Geocodificar o endereço do restaurante
      console.log('Geocodificando restaurante:', restaurantAddress);
      const originPoint = await geocodeAddress(restaurantAddress);
      setOrigin(originPoint);

      // Array para armazenar os pontos originais na ordem de upload
      const originalPoints: { 
        point: RoutePoint; 
        deliveryData: typeof deliveryPoints[0];
      }[] = [];

      // Geocodificar os pontos de entrega e manter referência aos dados originais
      console.log('Geocodificando pontos de entrega:', deliveryPoints);
      for (let i = 0; i < deliveryPoints.length; i++) {
        const coords = await geocodeAddress(deliveryPoints[i].address);
        originalPoints.push({
          point: coords,
          deliveryData: deliveryPoints[i]
        });
      }

      // Se tiver apenas um ponto, não precisa otimizar
      if (originalPoints.length === 1) {
        console.log('Apenas um ponto de entrega, calculando rota direta');
        const route = await getDirections(originPoint, originalPoints[0].point);
        newRoutes.push(route);
        setDestinations([originalPoints[0].point]);
      } 
      // Se tiver múltiplos pontos, calcular a matriz de distâncias
      else if (originalPoints.length > 1) {
        console.log('Múltiplos pontos, calculando matriz de distâncias');
        
        // Criar array com todos os pontos na ordem original
        const allPoints = [originPoint, ...originalPoints.map(p => p.point)];
        
        // Calcular todas as distâncias entre os pontos
        const distances = await Promise.all(
          allPoints.map(async (point1) => {
            const results = await Promise.all(
              allPoints.map(async (point2) => {
                if (point1 === point2) return 0;
                const route = await getDirections(point1, point2);
                return route.length; // Usar o comprimento da rota como distância
              })
            );
            return results;
          })
        );
        
        console.log('Matriz de distâncias calculada:', distances);
        
        // Encontrar o ponto mais distante do restaurante
        const restaurantDistances = distances[0].slice(1); // Ignorar a distância do restaurante para ele mesmo
        const farthestIndex = findFarthestPointIndex(restaurantDistances);
        console.log('Índice do ponto mais distante:', farthestIndex);
        
        // Começar com todos os pontos exceto o mais distante
        const orderedPoints: typeof originalPoints = [];
        const remainingPoints = [...originalPoints];
        const farthestPoint = remainingPoints.splice(farthestIndex, 1)[0]; // Remover e guardar o ponto mais distante
        
        // Começar do restaurante
        let currentPoint = originPoint;
        let currentPointIndex = 0; // Índice do restaurante na matriz de distâncias
        
        // Adicionar os pontos na ordem do mais próximo para o mais distante
        while (remainingPoints.length > 0) {
          // Encontrar o ponto mais próximo do ponto atual
          let nearestIndex = 0;
          let nearestDistance = Infinity;
          
          for (let i = 0; i < remainingPoints.length; i++) {
            const point = remainingPoints[i].point;
            const pointIndex = allPoints.findIndex(p => p === point);
            const distance = distances[currentPointIndex][pointIndex];
            
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = i;
            }
          }
          
          // Adicionar o ponto mais próximo à lista ordenada
          const nextPoint = remainingPoints.splice(nearestIndex, 1)[0];
          orderedPoints.push(nextPoint);
          
          // Atualizar o ponto atual para o próximo cálculo
          currentPoint = nextPoint.point;
          currentPointIndex = allPoints.findIndex(p => p === currentPoint);
        }
        
        // Adicionar o ponto mais distante por último
        orderedPoints.push(farthestPoint);
        
        console.log('Ordem otimizada:', 
          orderedPoints.map(p => ({
            address: p.deliveryData.address,
            coords: p.point
          }))
        );
        
        // Calcular a rota completa
        let previousPoint = originPoint;
        const destinationPoints = [];
        
        for (const point of orderedPoints) {
          const route = await getDirections(previousPoint, point.point);
          newRoutes.push(route);
          destinationPoints.push(point.point);
          previousPoint = point.point;
        }
        
        // Atualizar o estado com os pontos otimizados
        setDestinations(destinationPoints);
        
        // Atualizar a ordem dos pontos de entrega
        const newDeliveryPoints = orderedPoints.map(p => p.deliveryData);
        deliveryPoints.splice(0, deliveryPoints.length, ...newDeliveryPoints);
        
        console.log('Ordem final das entregas:', newDeliveryPoints.map(p => p.address));
      }

      console.log('Rotas calculadas:', newRoutes);
      setRoutes(newRoutes);
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setError('Erro ao calcular rota. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular distância entre dois pontos usando a fórmula de Haversine
  const calculateHaversineDistance = (point1: RoutePoint, point2: RoutePoint) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  const findFarthestPoint = (origin: RoutePoint, points: RoutePoint[]): number => {
    let maxDistance = -1;
    let farthestIndex = 0;

    points.forEach((point, index) => {
      const distance = calculateHaversineDistance(origin, point);
      console.log(`Distância do restaurante até ponto ${index}:`, distance.toFixed(2), 'km');
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestIndex = index;
      }
    });

    console.log(`Ponto mais distante é o índice ${farthestIndex} com distância de ${maxDistance.toFixed(2)} km`);
    return farthestIndex;
  };

  const findFarthestPointIndex = (distances: number[]) => {
    let maxDistance = -1;
    let farthestIndex = 0;

    distances.forEach((distance, index) => {
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestIndex = index;
      }
    });

    return farthestIndex;
  };

  useEffect(() => {
    if (restaurantAddress && deliveryPoints.length > 0) {
      calculateRoute();
    }
  }, [restaurantAddress, deliveryPoints]);

  useEffect(() => {
    // Abre todos os popups após um pequeno delay para garantir que o mapa foi carregado
    const timer = setTimeout(() => {
      markerRefs.current.forEach(marker => {
        if (marker) {
          marker.openPopup();
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [origin, destinations]);

  if (loading) {
    return <div>Carregando mapa...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!origin) {
    return <div>Aguardando dados do mapa...</div>;
  }

  const defaultCenter: [number, number] = [-25.4279409, -49.2745278]; // Curitiba

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Desabilitar controles de zoom padrão
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Marcador do restaurante */}
        <Marker 
          position={[origin.lat, origin.lng]}
          ref={ref => {
            if (ref) {
              markerRefs.current[0] = ref;
            }
          }}
        >
          <Popup>
            <div className="font-semibold text-lg text-blue-700 mb-1">Coleta</div>
            <div className="text-gray-600">{restaurantAddress}</div>
          </Popup>
        </Marker>

        {/* Marcadores dos pontos de entrega */}
        {destinations.map((point, index) => (
          <Marker 
            key={index} 
            position={[point.lat, point.lng]}
            ref={ref => {
              if (ref) {
                markerRefs.current[index + 1] = ref;
              }
            }}
          >
            <Popup>
              <div className="font-semibold text-lg text-green-700 mb-1">
                Entrega {index + 1}
              </div>
              <div className="text-gray-700 font-medium mb-1">
                {deliveryPoints[index].customerName}
              </div>
              <div className="text-gray-600 text-sm">
                {deliveryPoints[index].address}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Renderizar rotas */}
        {routes.length > 0 && routes.map((route, index) => {
          console.log(`Renderizando rota ${index} (primeiros 3 pontos):`, JSON.stringify(route.slice(0, 3), null, 2));
          return (
            <Polyline
              key={index}
              positions={route}
              color={index === 0 ? '#FF4444' : '#2196F3'}
              weight={4}
              opacity={0.8}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
