import { DeliveryData } from '../types';

export function parseDeliveryData(text: string): Partial<DeliveryData> | null {
  try {
    // Extract customer name - tentando vários padrões
    let customerName = '';
    const patterns = [
      /Cliente:\s*([^:\n]+)(?=\n|$)/i,
      /Cliente\s*:\s*([^:\n]+)(?=\n|$)/i,
      /Nome\s*:\s*([^:\n]+)(?=\n|$)/i,
      /Cliente\s+([^:\n]+)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        customerName = match[1].trim();
        console.log('Found customer name with pattern:', pattern);
        console.log('Customer name:', customerName);
        break;
      }
    }

    // Extract ID
    const idMatch = text.match(/ID:\s*(\d+)/);
    const id = idMatch ? idMatch[1] : `delivery-${Date.now()}`;

    // Extract address components
    const addressMatch = text.match(/Endereco:\s*(.*?)\s*(?=Bairro:|$)/);
    const neighborhoodMatch = text.match(/Bairro:\s*(.*?)\s*(?=Comp:|$)/);
    const cityMatch = text.match(/Cidade:\s*(.*?)\s*(?=CEP:|$)/);
    const complementMatch = text.match(/Comp:\s*(.*?)\s*(?=Cidade:|$)/);

    // Parse street and number from address
    const address = addressMatch ? addressMatch[1].trim() : '';
    const [street, number] = address.split(/,\s*/);

    // Extract order details
    const orderNumberMatch = text.match(/Pedido[:\s]+(\d+)/i);
    const orderDateMatch = text.match(/Data[:\s]+([\d\/]+)/i);
    const totalAmountMatch = text.match(/Total[:\s]+R?\$?\s*([\d,.]+)/i);

    // Parse store information
    const storeNameMatch = text.match(/Loja[:\s]+([^\n]+)/i);
    const storeCnpjMatch = text.match(/CNPJ[:\s]+([\d\.\/-]+)/i);

    const totalAmount = totalAmountMatch 
      ? parseFloat(totalAmountMatch[1].replace('.', '').replace(',', '.'))
      : undefined;

    return {
      id,
      imageUrl: '', // Será preenchido depois
      timestamp: Date.now(),
      customerName: customerName || undefined,
      street: street || undefined,
      number: number || undefined,
      neighborhood: neighborhoodMatch ? neighborhoodMatch[1].trim() : undefined,
      city: cityMatch ? cityMatch[1].trim() : undefined,
      complement: complementMatch ? complementMatch[1].trim() : undefined,
      orderNumber: orderNumberMatch ? orderNumberMatch[1] : undefined,
      orderDate: orderDateMatch ? orderDateMatch[1] : undefined,
      totalAmount,
      store: storeNameMatch ? {
        name: storeNameMatch[1].trim(),
        cnpj: storeCnpjMatch ? storeCnpjMatch[1] : undefined
      } : undefined
    };
  } catch (error) {
    console.error('Error parsing delivery data:', error);
    return null;
  }
}