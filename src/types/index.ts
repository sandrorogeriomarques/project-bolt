export interface Restaurant {
  id: number;
  field_3040201: string; // name
  field_3040218: string; // full_address
  field_3040219: string; // coordinates
  field_3040220: boolean; // active
  field_3040221: string; // street
  field_3040222: string; // number
  field_3040223: string; // neighborhood
  field_3040224: string; // city
  field_3040225: string; // state
  field_3040226: string; // postal_code
}

export interface User {
  id: number;
  field_3040201: string; // name
  field_3016950: string; // avatar
  field_3016951: string; // whatsapp
  name: string;
  avatar: string;
  whatsapp: string;
}

export interface TempUser {
  whatsapp: string;
  code: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  field_3040223: string; // theme
  field_3040224: string; // language
  field_3040225: string; // notifications
}

export interface Delivery {
  id: number;
  field_3040227: number; // restaurant_id
  field_3040228: string; // status
  field_3040229: string; // delivery_date
  field_3040230: string; // delivery_time
  field_3040231: string; // delivery_address
  field_3040232: string; // delivery_notes
  field_3040233: number; // user_id
}

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

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}
