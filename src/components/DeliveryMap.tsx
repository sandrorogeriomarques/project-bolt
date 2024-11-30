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

interface RouteInfo {
  address: string;
  distance: number;
  duration: number;
}

interface DirectionsResult {
  points: Array<[number, number]>;
  distance: number;
  duration: number;
  startAddress: string;
  endAddress: string;
}

export function DeliveryMap({ restaurantAddress, deliveryPoints }: DeliveryMapProps) {
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destinations, setDestinations] = useState<RoutePoint[]>([]);
  const [routes, setRoutes] = useState<Array<Array<[number, number]>>>([]);
  const [routeInfos, setRouteInfos] = useState<RouteInfo[]>([]);
  const [returnInfo, setReturnInfo] = useState<RouteInfo | null>(null);
  const [totalInfo, setTotalInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [estimatedReturn, setEstimatedReturn] = useState<string>('');
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

  // Função para calcular distância entre dois pontos usando a Matrix API
  const getMatrixDistance = async (origin: RoutePoint, destination: RoutePoint): Promise<number> => {
    try {
      console.log('Chamando Matrix API com:', {
        origin: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`
      });

      const response = await axios.post('/api/distance-matrix', {
        origin: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      });

      console.log('Resposta da Matrix API:', response.data);

      if (response.data.status !== 'OK') {
        throw new Error(`Erro na API do Google: ${response.data.status}`);
      }

      return response.data.rows[0].elements[0].distance.value;
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      throw error;
    }
  };

  const getDirections = async (origin: RoutePoint, destination: RoutePoint): Promise<DirectionsResult> => {
    try {
      const response = await axios.post('/api/directions', {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Erro na API do Google: ${response.data.status}`);
      }

      // Extrair informações da rota
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        points: polyline.decode(route.overview_polyline.points),
        distance: leg.distance.value,
        duration: leg.duration.value,
        startAddress: leg.start_address,
        endAddress: leg.end_address
      };
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
      const newRouteInfos: RouteInfo[] = [];
      let deliveryDistance = 0;
      let deliveryDuration = 0;

      // Geocodificar o endereço do restaurante
      console.log('Geocodificando restaurante:', restaurantAddress);
      const originPoint = await geocodeAddress(restaurantAddress);
      if (!originPoint) {
        throw new Error('Não foi possível encontrar o endereço do restaurante');
      }
      setOrigin(originPoint);

      // Se não houver pontos de entrega, não precisa calcular rota
      if (deliveryPoints.length === 0) {
        setLoading(false);
        return;
      }

      // Geocodificar todos os pontos de entrega
      console.log('Geocodificando pontos de entrega:', deliveryPoints);
      const points = await Promise.all(
        deliveryPoints.map(async (point) => {
          const location = await geocodeAddress(point.address);
          if (!location) {
            throw new Error(`Não foi possível encontrar o endereço: ${point.address}`);
          }
          return {
            point: location,
            deliveryData: point
          };
        })
      );

      // Se tiver apenas um ponto, calcular rota direta
      if (points.length === 1) {
        console.log('Calculando rota para um único ponto');
        const routeResult = await getDirections(originPoint, points[0].point);
        newRoutes.push(routeResult.points);

        // Adicionar informações da rota
        newRouteInfos.push({
          address: points[0].deliveryData.address,
          distance: routeResult.distance,
          duration: routeResult.duration / 60 // converter segundos para minutos
        });
        deliveryDistance += routeResult.distance;
        deliveryDuration += routeResult.duration / 60;
      }
      // Se tiver múltiplos pontos, calcular matriz de distâncias
      else if (points.length > 1) {
        console.log('Calculando matriz de distâncias para múltiplos pontos');
        
        // Criar array com todos os pontos na ordem original
        const allPoints = [originPoint, ...points.map(p => p.point)];
        
        // Calcular todas as distâncias entre os pontos usando a Matrix API
        const distances = await Promise.all(
          allPoints.map(async (point1) => {
            const results = await Promise.all(
              allPoints.map(async (point2) => {
                if (point1 === point2) return 0;
                return await getMatrixDistance(point1, point2);
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
        const orderedPoints: typeof points = [];
        const remainingPoints = [...points];
        const farthestPoint = remainingPoints.splice(farthestIndex, 1)[0];

        // Começar do restaurante
        let currentPoint = originPoint;
        let currentPointIndex = 0;

        // Adicionar os pontos na ordem do mais próximo para o mais distante
        while (remainingPoints.length > 0) {
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

          const nextPoint = remainingPoints.splice(nearestIndex, 1)[0];
          orderedPoints.push(nextPoint);

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

        // Calcular rotas na ordem otimizada
        let previousPoint = originPoint;
        for (const point of orderedPoints) {
          const routeResult = await getDirections(previousPoint, point.point);
          newRoutes.push(routeResult.points);

          // Adicionar informações da rota
          newRouteInfos.push({
            address: point.deliveryData.address,
            distance: routeResult.distance,
            duration: routeResult.duration / 60
          });
          deliveryDistance += routeResult.distance;
          deliveryDuration += routeResult.duration / 60;

          previousPoint = point.point;
        }
      }

      // Calcular rota de retorno ao restaurante (chamada separada)
      const lastPoint = points[points.length - 1].point;
      console.log('Calculando rota de retorno ao restaurante');
      const returnRouteResult = await getDirections(lastPoint, originPoint);

      // Atualizar informações de retorno
      setReturnInfo({
        address: 'Retorno ao restaurante',
        distance: returnRouteResult.distance,
        duration: returnRouteResult.duration / 60
      });

      // Calcular totais (entrega + retorno)
      const totalDistance = deliveryDistance + returnRouteResult.distance;
      const totalDuration = deliveryDuration + (returnRouteResult.duration / 60);

      // Atualizar estados
      setRoutes(newRoutes);
      setRouteInfos(newRouteInfos);
      setTotalInfo({
        distance: totalDistance,
        duration: totalDuration
      });

      // Calcular horário de retorno
      const now = new Date();
      const returnTime = new Date(now.getTime() + (totalDuration * 60 * 1000));
      setEstimatedReturn(
        returnTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );

      console.log('Rotas calculadas:', {
        deliveryRoutes: newRoutes,
        returnRoute: returnRouteResult,
        routeInfos: newRouteInfos,
        returnInfo: {
          distance: returnRouteResult.distance,
          duration: returnRouteResult.duration / 60
        },
        totalInfo: {
          distance: totalDistance,
          duration: totalDuration
        },
        estimatedReturn: returnTime.toLocaleTimeString()
      });

    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setError('Erro ao calcular rota. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular a distância de uma rota em metros
  const calculateDistance = (route: Array<[number, number]>): number => {
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const point1 = route[i - 1];
      const point2 = route[i];
      distance += getDistanceFromLatLonInMeters(point1[0], point1[1], point2[0], point2[1]);
    }
    return distance;
  };

  // Função para calcular distância entre dois pontos em metros
  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    return `${(meters / 1000).toFixed(1)} Km`;
  };

  const calculateReturnTime = (totalMinutes: number): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMinutes);
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    <div className="flex flex-col gap-4">
      <div className="relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcador do restaurante */}
          {origin && (
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
          )}

          {/* Marcadores dos pontos de entrega */}
          {routeInfos.map((routeInfo, index) => {
            if (routes[index] && routes[index].length > 0) {
              const lastPoint = routes[index][routes[index].length - 1];
              return (
                <Marker
                  key={`delivery-${index}`}
                  position={[lastPoint[0], lastPoint[1]]}
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
                      {routeInfo.address}
                    </div>
                    <div className="text-gray-500 text-xs mt-2">
                      {(routeInfo.distance / 1000).toFixed(1)} km • {Math.round(routeInfo.duration)} min
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          {/* Linhas da rota */}
          {routes.map((route, index) => (
            <Polyline
              key={index}
              positions={route}
              color="#2563eb"
              weight={4}
              opacity={0.7}
            />
          ))}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Informações da rota */}
      {routeInfos.length > 0 && (
        <div className="mt-4 p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Rota otimizada</h3>

          <div className="space-y-3 font-mono">
            {/* Cabeçalho */}
            <div className="flex text-gray-600 text-sm border-b pb-2">
              <span className="flex-1">Endereço</span>
              <span className="w-24 text-right">Distância</span>
              <span className="w-20 text-right ml-4">Tempo</span>
            </div>

            {/* Pontos de entrega */}
            {routeInfos.map((info, index) => (
              <div key={index} className="flex items-center">
                <span className="flex-1">
                  {index + 1}. {info.address}
                </span>
                <span className="w-24 text-right">
                  {formatDistance(info.distance)}
                </span>
                <span className="w-20 text-right ml-4">
                  {formatDuration(info.duration)}
                </span>
              </div>
            ))}

            {/* Retorno */}
            {returnInfo && (
              <div className="flex items-center text-gray-600">
                <span className="flex-1 pl-4">Retorno</span>
                <span className="w-24 text-right">
                  {formatDistance(returnInfo.distance)}
                </span>
                <span className="w-20 text-right ml-4">
                  {formatDuration(returnInfo.duration)}
                </span>
              </div>
            )}

            {/* Linha divisória */}
            <div className="border-t border-gray-300 my-2">
              <div className="flex justify-between text-xs text-gray-400 px-12">
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            </div>

            {/* Total */}
            {totalInfo && (
              <div className="flex items-center font-semibold">
                <span className="flex-1">Total:</span>
                <span className="w-24 text-right">
                  {formatDistance(totalInfo.distance)}
                </span>
                <span className="w-20 text-right ml-4">
                  {formatDuration(totalInfo.duration)}
                </span>
              </div>
            )}

            {/* Horário de retorno */}
            {estimatedReturn && (
              <div className="mt-4 text-right text-gray-600">
                Retorno previsto: <span className="font-semibold">{estimatedReturn}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
