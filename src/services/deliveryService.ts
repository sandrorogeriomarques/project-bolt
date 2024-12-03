import { SharedDeliveryData, DeliveryData } from '../types';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

export async function createSharedDelivery(
  deliveries: DeliveryData[], 
  restaurantData: any,
  routeData: {
    points: Array<[number, number]>;
    distances: number[];
    durations: number[];
    totalDistance: number;
    totalDuration: number;
  }
): Promise<string> {
  try {
    // Converter imagens para base64
    const receipts = await Promise.all(
      deliveries.map(async (delivery) => {
        const response = await fetch(delivery.imageUrl);
        const blob = await response.blob();
        const base64 = await convertBlobToBase64(blob);
        return {
          id: delivery.id,
          image: base64
        };
      })
    );

    // Gerar ID único curto
    const hash = nanoid(10);

    // Converter arrays aninhados em formato aceitável pelo Firestore
    const routePoints = routeData.points.map(point => ({
      lat: point[0],
      lng: point[1]
    }));

    const sharedData: SharedDeliveryData = {
      hash,
      restaurantId: restaurantData.id,
      restaurantAddress: restaurantData.field_3040218,
      deliveryPoints: deliveries.map(d => ({
        id: d.id,
        customerName: d.customerName || '',
        address: `${d.street || ''}, ${d.number || ''}`,
        neighborhood: d.neighborhood || '',
        city: d.city || '',
        state: restaurantData.field_3040216 || ''
      })),
      receipts,
      route: {
        points: routePoints, // Usando o formato convertido
        distances: routeData.distances,
        durations: routeData.durations,
        totalDistance: routeData.totalDistance,
        totalDuration: routeData.totalDuration
      },
      createdAt: new Date().toISOString(),
      status: 'completed' as const
    };

    // Salvar no Firestore
    await setDoc(doc(db, 'shared_deliveries', hash), sharedData);
    console.log('Entrega compartilhada criada:', hash);
    
    return hash;
  } catch (error) {
    console.error('Erro ao criar entrega compartilhada:', error);
    throw new Error('Não foi possível criar o link de compartilhamento');
  }
}

export async function getSharedDelivery(hash: string): Promise<SharedDeliveryData> {
  const docRef = doc(db, 'shared_deliveries', hash);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Entrega não encontrada');
  }

  return docSnap.data() as SharedDeliveryData;
}

function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 