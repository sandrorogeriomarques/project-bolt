export interface User {
  id: string;
  name: string;
  whatsapp: string;
  avatar?: string;
}

export interface TempUser extends Partial<User> {
  verificationCode?: string;
}

export interface DeliveryData {
  id: string;
  imageUrl: string;
  timestamp: number;
  customerName?: string;
  deliveryPerson?: {
    id: string;
    name: string;
  };
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  complement?: string;
  extractedBy?: 'ocrspace' | 'googlevision';  // Novo campo para indicar qual API foi usada
  // Dados extraídos do cupom fiscal
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: number;
  items?: {
    name: string;
    quantity: number;
    price: number;
  }[];
  store?: {
    name: string;
    address?: string;
    cnpj?: string;
  };
}

export interface OCRResponse {
  text: string;
}

export interface SharedDeliveryData {
  hash: string;
  restaurantId: string;
  restaurantAddress: string;
  deliveryPoints: SharedDeliveryPoint[];
  receipts: {
    id: string;
    image: string;
  }[];
  route: {
    points: Array<{lat: number; lng: number}>;
    distances: number[];
    durations: number[];
    totalDistance: number;
    totalDuration: number;
  };
  createdAt: string;
  status: 'completed' | 'in_progress';
}

export interface SharedDeliveryPoint {
  id: string;
  customerName: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface DirectionsResult {
  points: Array<[number, number]>;
  distance: number;
  duration: number;
  startAddress: string;
  endAddress: string;
}