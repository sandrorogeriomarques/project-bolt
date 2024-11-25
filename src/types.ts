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