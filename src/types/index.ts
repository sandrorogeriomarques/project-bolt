export interface DeliveryData {
  id: string;
  customerName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement?: string;
  imageUrl?: string;
  timestamp?: number;
  source?: string;
}
