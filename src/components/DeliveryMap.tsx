import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import L from 'leaflet';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { matrixCacheService } from '../services/matrixCacheService';
import { getRestaurantCoordinates } from '../services/restaurantService';
import { baserowApi } from '../services/baserowApi';

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

interface DeliveryPoint {
  id: string;
  customerName: string;
  street: string;
  number: string;
  neighborhood: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  address?: string;
}

interface DeliveryMapProps {
  restaurantId: string;
  restaurantAddress: string;
  deliveryPoints: DeliveryPoint[];
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

// Componente para ajustar o zoom automaticamente
function AutoZoom({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15
      });
    }
  }, [points, map]);

  return null;
}

export function DeliveryMap({ restaurantId, restaurantAddress, deliveryPoints }: DeliveryMapProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<DirectionsResult[]>([]);
  const [returnRoute, setReturnRoute] = useState<DirectionsResult | null>(null);
  const [routeInfos, setRouteInfos] = useState<RouteInfo[]>([]);
  const [returnInfo, setReturnInfo] = useState<RouteInfo | null>(null);
  const [totalInfo, setTotalInfo] = useState<RouteInfo | null>(null);
  const [restaurantCoords, setRestaurantCoords] = useState<RoutePoint | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<Array<{point: RoutePoint; id: string}>>([]);
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([]);
  const [coordsLoaded, setCoordsLoaded] = useState(false);
  const [estimatedReturn, setEstimatedReturn] = useState<string>('');
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

  // Função para formatar endereço do restaurante
  const formatRestaurantAddress = (address: string): string => {
    return address.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  };

  // Função para formatar endereço de entrega
  const formatDeliveryAddress = (delivery: DeliveryPoint): string => {
    try {
      if (!delivery) {
        throw new Error('Dados de entrega ausentes');
      }

      if (delivery.address) {
        return delivery.address.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
      }

      // Remove vírgulas extras e espaços duplicados
      const street = delivery.street.replace(/,+/g, '').trim();
      const number = delivery.number.trim();
      const neighborhood = delivery.neighborhood.trim();
      const city = (delivery.city || 'Curitiba').replace(/\s*-\s*PR,?\s*PR$/i, ' - PR').trim();

      // Formata o endereço completo
      return `${street}, ${number}, ${neighborhood}, ${city}`;
    } catch (error) {
      console.error('Erro ao formatar endereço:', error);
      throw new Error(`Dados de entrega inválidos para ${delivery.customerName}`);
    }
  };

  // Função para capitalizar nome do cliente
  const capitalizeCustomerName = (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Não capitaliza artigos e preposições
        const minorWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
        return minorWords.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Função para formatar endereço da API
  const formatApiAddress = (result: any): string => {
    try {
      if (!result || !result.formatted_address) {
        throw new Error('Resultado da API inválido');
      }

      // Pega o endereço completo
      let address = result.formatted_address;

      // Remove o Brasil do final
      address = address.replace(/,?\s*Brasil$/i, '');

      // Remove CEPs no formato XXXXX-XXX ou XXXXXXXX
      address = address.replace(/,?\s*\d{5}-?\d{0,3}/g, '');

      // Limpa espaços e vírgulas extras
      address = address.split(',')
        .map(part => part.trim())
        .filter(part => part && !part.match(/^(Brasil|PR)$/)) // Remove partes que são apenas Brasil ou PR
        .join(', ');

      // Remove espaços duplicados
      address = address.replace(/\s+/g, ' ').trim();

      return address;
    } catch (error) {
      console.error('Erro ao formatar endereço da API:', error);
      return 'Endereço indisponível';
    }
  };

  // Função para formatar endereço para exibição
  const formatDisplayAddress = (address: string): string => {
    if (!address) return 'Endereço indisponível';
    
    // Remove o Brasil do final
    let formattedAddress = address.replace(/,?\s*Brasil$/i, '');
    
    // Remove CEPs no formato XXXXX-XXX ou XXXXXXXX
    formattedAddress = formattedAddress.replace(/,?\s*\d{5}-?\d{0,3}/g, '');
    
    // Remove PR do final se estiver sozinho
    formattedAddress = formattedAddress.replace(/,\s*PR$/i, '');
    
    // Limpa vírgulas e espaços extras
    formattedAddress = formattedAddress
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .join(', ');
    
    return formattedAddress;
  };

  // Função para geocodificar um endereço
  const geocodeAddress = async (address: string) => {
    console.log('Geocodificando endereço:', address);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: GOOGLE_MAPS_API_KEY,
            region: 'br'
          }
        }
      );

      if (response.data.status === 'ZERO_RESULTS') {
        throw new Error(`Endereço não encontrado: ${address}`);
      }

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        console.log('Coordenadas encontradas para', address, ':', location);
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: formatApiAddress(response.data.results[0])
        };
      }

      throw new Error(`Erro na geocodificação: ${response.data.status} - ${address}`);
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      throw error;
    }
  };

  // Função para buscar coordenadas do restaurante do banco
  const getRestaurantCoordinates = async (restaurantId: string) => {
    try {
      const response = await baserowApi.get(
        `/database/rows/table/${import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID}/${restaurantId}/`,
        {
          headers: {
            'Authorization': `Token ${import.meta.env.VITE_BASEROW_TOKEN}`
          }
        }
      );

      if (response.data && response.data.field_3040219) {
        const [lat, lng] = response.data.field_3040219.split(',').map(Number);
        return { lat, lng };
      }
      throw new Error('Coordenadas do restaurante não encontradas');
    } catch (error) {
      console.error('Erro ao buscar coordenadas do restaurante:', error);
      throw error;
    }
  };

  // Função para geocodificar todos os endereços
  const geocodeAllAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar coordenadas do restaurante do banco
      const restaurantPoint = await getRestaurantCoordinates(restaurantId);
      if (!restaurantPoint) {
        // Se não houver coordenadas no banco, geocodificar o endereço
        const formattedAddress = formatRestaurantAddress(restaurantAddress);
        const coords = await geocodeAddress(formattedAddress);
        setRestaurantCoords(coords);
      } else {
        setRestaurantCoords(restaurantPoint);
      }

      // Geocodificar pontos de entrega
      const points = await Promise.all(
        deliveryPoints.map(async (point) => {
          if (point.coordinates) {
            // Se já tiver coordenadas, usar diretamente
            return { point: point.coordinates, id: point.id };
          }
          // Se não tiver coordenadas, geocodificar
          const address = formatDeliveryAddress(point);
          const coords = await geocodeAddress(address);
          return { point: coords, id: point.id };
        })
      );
      
      setDeliveryCoords(points);
      setCoordsLoaded(true);
    } catch (error) {
      console.error('Erro ao geocodificar endereços:', error);
      setError('Erro ao carregar coordenadas dos endereços. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular distância entre dois pontos usando a Matrix API
  const getMatrixDistance = async (origin: RoutePoint, destination: RoutePoint): Promise<number> => {
    const retryCount = 3;
    const retryDelay = 1000; // 1 segundo

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const originStr = `${origin.lat},${origin.lng}`;
        const destinationStr = `${destination.lat},${destination.lng}`;

        // Tentar buscar do cache primeiro
        const cachedResult = await matrixCacheService.getCachedDistance(originStr, destinationStr);
        if (cachedResult) {
          console.log('Usando distância do cache:', cachedResult);
          return cachedResult.field_3040303;
        }

        // Configurar URL base do axios
        const baseURL = import.meta.env.DEV ? 'http://localhost:8081' : '';
        const response = await axios.post(`${baseURL}/api/distance-matrix`, {
          origin: originStr,
          destinations: destinationStr,
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        });

        if (!response.data || response.data.status !== 'OK') {
          throw new Error(`Erro na API do Google: ${response.data?.status || 'Resposta inválida'}`);
        }

        const element = response.data.rows[0]?.elements[0];
        if (!element || element.status !== 'OK') {
          throw new Error(`Elemento da matriz inválido: ${element?.status || 'Não encontrado'}`);
        }

        const distance = element.distance.value;
        const duration = element.duration.value;

        // Salvar no cache
        await matrixCacheService.cacheDistance(
          originStr,
          destinationStr,
          distance,
          duration
        );

        return distance;
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou:`, error);
        
        if (attempt === retryCount) {
          throw new Error(`Falha ao calcular distância após ${retryCount} tentativas: ${error.message}`);
        }
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Erro inesperado no cálculo de distância');
  };

  const getDirections = async (origin: RoutePoint, destination: RoutePoint): Promise<DirectionsResult> => {
    const retryCount = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const originStr = `${origin.lat},${origin.lng}`;
        const destinationStr = `${destination.lat},${destination.lng}`;

        // Configurar URL base do axios
        const baseURL = import.meta.env.DEV ? 'http://localhost:8081' : '';
        const response = await axios.post(`${baseURL}/api/directions`, {
          origin: originStr,
          destination: destinationStr,
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        });

        if (!response.data || response.data.status !== 'OK') {
          throw new Error(`Erro na API do Google: ${response.data?.status || 'Resposta inválida'}`);
        }

        const route = response.data.routes[0];
        if (!route) {
          throw new Error('Nenhuma rota encontrada');
        }

        const leg = route.legs[0];
        if (!leg) {
          throw new Error('Dados da rota incompletos');
        }

        return {
          points: polyline.decode(route.overview_polyline.points),
          distance: leg.distance.value,
          duration: leg.duration.value,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        };
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou:`, error);
        
        if (attempt === retryCount) {
          throw new Error(`Falha ao obter direções após ${retryCount} tentativas: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Erro inesperado ao obter direções');
  };

  // Função para otimizar ordem dos pontos de entrega
  const optimizeDeliveryOrder = async (
    restaurantPoint: RoutePoint,
    deliveryPoints: Array<{ point: RoutePoint; id: string }>
  ): Promise<string[]> => {
    try {
      // Primeiro, encontrar o ponto mais distante do restaurante
      let maxDistance = -1;
      let farthestPointId = '';
      
      for (let i = 0; i < deliveryPoints.length; i++) {
        if (!deliveryPoints[i].point) continue;
        const distance = await getMatrixDistance(restaurantPoint, deliveryPoints[i].point);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestPointId = deliveryPoints[i].id;
        }
      }

      // Remover o ponto mais distante da lista
      const remainingPoints = deliveryPoints.filter(p => p.id !== farthestPointId);
      
      // Criar matriz de distâncias para os pontos restantes
      const distances: { [key: string]: { [key: string]: number } } = {};
      
      // Inicializar matriz com restaurante como ponto 'R'
      distances['R'] = {};
      for (const point of remainingPoints) {
        if (!point.point) continue;
        const distance = await getMatrixDistance(restaurantPoint, point.point);
        distances['R'][point.id] = distance;
      }

      // Calcular distâncias entre todos os pontos restantes
      for (const point1 of remainingPoints) {
        if (!point1.point) continue;
        distances[point1.id] = {};
        for (const point2 of remainingPoints) {
          if (!point2.point || point1.id === point2.id) continue;
          const distance = await getMatrixDistance(point1.point, point2.point);
          distances[point1.id][point2.id] = distance;
        }
      }

      // Implementar algoritmo do vizinho mais próximo para os pontos restantes
      const visited = new Set<string>();
      const route: string[] = [];
      let currentPoint = 'R';

      // Ordenar pontos restantes pelo vizinho mais próximo
      while (route.length < remainingPoints.length) {
        let minDistance = Infinity;
        let nextPoint = '';

        for (const point in distances[currentPoint]) {
          if (!visited.has(point) && distances[currentPoint][point] < minDistance) {
            minDistance = distances[currentPoint][point];
            nextPoint = point;
          }
        }

        if (nextPoint) {
          route.push(nextPoint);
          visited.add(nextPoint);
          currentPoint = nextPoint;
        }
      }

      // Adicionar o ponto mais distante como último
      route.push(farthestPointId);

      console.log('Rota otimizada:', route);
      return route;
    } catch (error) {
      console.error('Erro ao otimizar ordem das entregas:', error);
      return deliveryPoints.map(p => p.id);
    }
  };

  // Função para calcular e otimizar rotas
  const calculateRoute = async () => {
    if (!restaurantCoords || deliveryCoords.length === 0) {
      console.error('Coordenadas não disponíveis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Otimizar ordem dos pontos de entrega
      const order = await optimizeDeliveryOrder(restaurantCoords, deliveryCoords);
      setOptimizedOrder(order);
      
      // Calcular rotas para cada ponto na ordem otimizada
      const routeResults: DirectionsResult[] = [];
      const infos: RouteInfo[] = [];
      
      let currentPoint = restaurantCoords;
      let totalDistance = 0;
      let totalDuration = 0;
      
      for (const pointId of order) {
        const nextPoint = deliveryCoords.find(p => p.id === pointId)?.point;
        if (!nextPoint) continue;

        const result = await getDirections(currentPoint, nextPoint);
        routeResults.push(result);
        
        const deliveryPoint = deliveryPoints.find(p => p.id === pointId);
        if (!deliveryPoint) continue;

        infos.push({
          address: result.endAddress, // Usando o endereço formatado da API
          distance: result.distance,
          duration: result.duration
        });
        
        totalDistance += result.distance;
        totalDuration += result.duration;
        currentPoint = nextPoint;
      }

      // Calcular rota de retorno
      const returnResult = await getDirections(currentPoint, restaurantCoords);
      
      setRoutes(routeResults);
      setReturnRoute(returnResult);
      setRouteInfos(infos);
      setReturnInfo({
        address: formatRestaurantAddress(restaurantAddress),
        distance: returnResult.distance,
        duration: returnResult.duration
      });
      setTotalInfo({
        address: 'Total',
        distance: totalDistance + returnResult.distance,
        duration: totalDuration + returnResult.duration
      });

      // Calcular horário de retorno
      const now = new Date();
      const returnTime = new Date(now.getTime() + (totalDuration + returnResult.duration));
      setEstimatedReturn(
        returnTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );

    } catch (error) {
      console.error('Erro ao calcular rotas:', error);
      setError('Erro ao calcular rotas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para obter todos os pontos da rota
  const getAllRoutePoints = (): Array<[number, number]> => {
    const allPoints: Array<[number, number]> = [];
    
    // Adicionar ponto do restaurante
    if (restaurantCoords) {
      allPoints.push([restaurantCoords.lat, restaurantCoords.lng]);
    }
    
    // Adicionar pontos das rotas
    routes.forEach(route => {
      allPoints.push(...route.points);
    });
    
    // Adicionar pontos da rota de retorno
    if (returnRoute) {
      allPoints.push(...returnRoute.points);
    }
    
    return allPoints;
  };

  useEffect(() => {
    if (restaurantAddress && deliveryPoints.length > 0) {
      geocodeAllAddresses();
    }
  }, [restaurantAddress, deliveryPoints]);

  useEffect(() => {
    if (coordsLoaded && restaurantCoords && deliveryCoords.length > 0) {
      calculateRoute();
    }
  }, [coordsLoaded, restaurantCoords, deliveryCoords]);

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
  }, [restaurantCoords, deliveryCoords]);

  // Configuração do ícone do restaurante (vermelho)
  const restaurantIcon = new L.Icon.Default({
    className: 'restaurant-marker', // Classe CSS para colorir o ícone
  });

  if (loading) {
    return <div>Carregando mapa...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!restaurantCoords) {
    return <div>Aguardando dados do mapa...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[600px] rounded-lg overflow-hidden map-container">
        <MapContainer
          center={[-25.4284, -49.2733]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Componente de zoom automático */}
          <AutoZoom points={getAllRoutePoints()} />

          {/* Marcador do restaurante */}
          {restaurantCoords && (
            <Marker
              position={[restaurantCoords.lat, restaurantCoords.lng]}
              ref={ref => {
                if (ref) {
                  markerRefs.current[0] = ref;
                }
              }}
              icon={new L.Icon.Default({
                className: 'restaurant-marker' // Aplica o filtro CSS para mudar a cor
              })}
            >
              <Popup>
                <div className="font-semibold text-lg text-blue-700 mb-1">
                  Restaurante
                </div>
                <div className="text-gray-600 text-sm">
                  {formatDisplayAddress(restaurantAddress)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores dos pontos de entrega */}
          {optimizedOrder.map((pointId, index) => {
            const coords = deliveryCoords.find(p => p.id === pointId)?.point;
            const deliveryPoint = deliveryPoints.find(p => p.id === pointId);
            const routeInfo = routeInfos[index];
            
            if (!coords || !deliveryPoint || !routeInfo) return null;

            return (
              <Marker
                key={`delivery-${pointId}`}
                position={[coords.lat, coords.lng]}
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
                    {capitalizeCustomerName(deliveryPoint.customerName)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {formatDisplayAddress(routeInfo.address)}
                  </div>
                  <div className="text-gray-500 text-xs mt-2">
                    {(routeInfo.distance / 1000).toFixed(1)} km • {Math.round(routeInfo.duration)} min
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Linhas da rota */}
          {routes.map((route, index) => (
            <Polyline
              key={index}
              positions={route.points}
              color="#2563eb"
              weight={4}
              opacity={0.7}
            />
          ))}

          {/* Linha de retorno */}
          {returnRoute && (
            <Polyline
              positions={returnRoute.points}
              color="#dc2626"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center map-loading-overlay">
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

          <div className="space-y-3">
            {/* Cabeçalho */}
            <div className="flex text-gray-600 text-sm border-b pb-2">
              <span className="w-8">#</span>
              <span className="flex-1">Cliente</span>
              <span className="flex-1">Endereço</span>
              <span className="w-24 text-right">Distância</span>
              <span className="w-20 text-right ml-4">Tempo</span>
            </div>

            {/* Pontos de entrega */}
            {optimizedOrder.map((pointId, index) => {
              const info = routeInfos[index];
              const deliveryPoint = deliveryPoints.find(p => p.id === pointId);
              
              if (!info || !deliveryPoint) return null;

              return (
                <div key={pointId} className="flex items-center text-sm">
                  <span className="w-8">{index + 1}</span>
                  <span className="flex-1">{capitalizeCustomerName(deliveryPoint.customerName)}</span>
                  <span className="flex-1">{formatDisplayAddress(info.address)}</span>
                  <span className="w-24 text-right">
                    {info.distance ? `${(info.distance / 1000).toFixed(1)} km` : 'N/A'}
                  </span>
                  <span className="w-20 text-right ml-4">
                    {info.duration ? `${Math.round(info.duration)} min` : 'N/A'}
                  </span>
                </div>
              );
            })}

            {/* Retorno */}
            {returnInfo && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-8">↩</span>
                  <span className="flex-1">Retorno</span>
                  <span className="flex-1">{formatDisplayAddress(returnInfo.address)}</span>
                  <span className="w-24 text-right">
                    {returnInfo.distance ? `${(returnInfo.distance / 1000).toFixed(1)} km` : 'N/A'}
                  </span>
                  <span className="w-20 text-right ml-4">
                    {returnInfo.duration ? `${Math.round(returnInfo.duration)} min` : 'N/A'}
                  </span>
                </div>
              </>
            )}

            {/* Total */}
            {totalInfo && (
              <>
                <div className="border-t border-gray-300 mt-2 pt-2">
                  <div className="flex items-center text-sm font-semibold">
                    <span className="w-8">Σ</span>
                    <span className="flex-1">Total</span>
                    <span className="flex-1"></span>
                    <span className="w-24 text-right">
                      {totalInfo.distance ? `${(totalInfo.distance / 1000).toFixed(1)} km` : 'N/A'}
                    </span>
                    <span className="w-20 text-right ml-4">
                      {totalInfo.duration ? `${Math.round(totalInfo.duration)} min` : 'N/A'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
