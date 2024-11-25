import { DeliveryData } from '../types';

export function parseDeliveryData(text: string): DeliveryData | null {
  try {
    // Extract ID
    const idMatch = text.match(/ID:\s*(\d+)/);
    const id = idMatch ? idMatch[1] : '';

    // Extract address components
    const addressMatch = text.match(/Endereco:\s*(.*?)\s*(?=Bairro:|$)/);
    const neighborhoodMatch = text.match(/Bairro:\s*(.*?)\s*(?=Comp:|$)/);
    const cityMatch = text.match(/Cidade:\s*(.*?)\s*(?=CEP:|$)/);
    const complementMatch = text.match(/Comp:\s*(.*?)\s*(?=Cidade:|$)/);

    // Parse street and number from address
    const address = addressMatch ? addressMatch[1].trim() : '';
    const [street, number] = address.split(/,\s*/);

    return {
      id,
      street: street || '',
      number: number || '',
      neighborhood: neighborhoodMatch ? neighborhoodMatch[1].trim() : '',
      city: cityMatch ? cityMatch[1].trim() : '',
      complement: complementMatch ? complementMatch[1].trim() : ''
    };
  } catch (error) {
    console.error('Error parsing delivery data:', error);
    return null;
  }
}