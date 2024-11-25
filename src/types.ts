export interface User {
  id: string;
  name: string;
  whatsapp: string;
  avatar?: string;
}

export interface DeliveryData {
  id: string;
  imageUrl: string;
  timestamp: number;
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