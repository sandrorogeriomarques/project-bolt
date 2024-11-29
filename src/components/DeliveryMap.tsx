import { useEffect, useState } from 'react';
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

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
      console.log('Usando chave da API:', GOOGLE_MAPS_API_KEY);
      
      // Adicionar 'Brasil' ao endereço para melhorar a precisão
      const fullAddress = `${address}, Brasil`;
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('URL da requisição:', url);
      
      const response = await axios.get(url);

      console.log('Resposta da API de Geocodificação:', response.data);

      if (response.data.status === 'ZERO_RESULTS') {
        throw new Error(`Endereço não encontrado: ${address}`);
      }

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        console.log('Coordenadas encontradas:', { lat, lng });
        return { lat, lng };
      }

      throw new Error(`Erro na geocodificação: ${response.data.status} - ${address}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro na requisição de geocodificação:', {
          status: error.response?.status,
          data: error.response?.data,
          address
        });
      }
      console.error('Erro ao geocodificar endereço:', error);
      throw error;
    }
  };

  const calculateDistanceMatrix = async (origin: RoutePoint, destinations: RoutePoint[]) => {
    try {
      const origins = `${origin.lat},${origin.lng}`;
      const dests = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${dests}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.rows && response.data.rows[0].elements) {
        const distances = response.data.rows[0].elements.map((element: any, index: number) => ({
          index,
          distance: element.distance.value,
        }));

        // Encontrar o ponto mais distante
        const farthestPoint = distances.reduce((max, current) => 
          current.distance > max.distance ? current : max
        , distances[0]);

        return farthestPoint.index;
      }
      throw new Error('Erro ao calcular matriz de distância');
    } catch (error) {
      console.error('Erro ao calcular matriz de distância:', error);
      throw error;
    }
  };

  const getDirections = async (origin: RoutePoint, destination: RoutePoint) => {
    try {
      console.log('Obtendo direções para:', { origin, destination });
      
      // Fazer a requisição através do nosso servidor backend
      const response = await axios.post('/api/directions', {
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

      console.log('Calculando rota com:', {
        restaurantAddress,
        deliveryPoints
      });

      // Geocodificar origem (restaurante)
      const originPoint = await geocodeAddress(restaurantAddress);
      console.log('Ponto de origem:', originPoint);
      setOrigin(originPoint);

      // Geocodificar todos os pontos de entrega
      const destinationPoints = await Promise.all(
        deliveryPoints.map(async point => {
          try {
            return await geocodeAddress(point.address);
          } catch (error) {
            console.error(`Erro ao geocodificar ponto de entrega ${point.id}:`, error);
            throw new Error(`Não foi possível encontrar o endereço: ${point.address}`);
          }
        })
      );
      console.log('Pontos de destino:', destinationPoints);
      setDestinations(destinationPoints);

      const newRoutes = [];

      // Calcular rota do restaurante para o primeiro ponto
      const firstRoute = await getDirections(originPoint, destinationPoints[0]);
      newRoutes.push(firstRoute);

      // Calcular rotas entre pontos de entrega
      for (let i = 0; i < destinationPoints.length - 1; i++) {
        const route = await getDirections(destinationPoints[i], destinationPoints[i + 1]);
        newRoutes.push(route);
      }

      console.log('Rotas calculadas:', newRoutes);
      setRoutes(newRoutes);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setError('Erro ao calcular rota. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantAddress && deliveryPoints.length > 0) {
      calculateRoute();
    }
  }, [restaurantAddress, deliveryPoints]);

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
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Marcador do restaurante */}
        <Marker position={[origin.lat, origin.lng]}>
          <Popup>Restaurante</Popup>
        </Marker>

        {/* Marcadores dos pontos de entrega */}
        {destinations.map((point, index) => (
          <Marker key={index} position={[point.lat, point.lng]}>
            <Popup>
              Entrega {index + 1}: {deliveryPoints[index].customerName}
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
