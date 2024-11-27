interface DeliveryData {
  id: string;
  customerName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}

// Função que extrai o ID
const extractId = (text: string): string => {
  // Procurar por padrões comuns de ID no texto
  const idPatterns = [
    /ID:\s*(\d+)/i,
    /^(\d{8})\s/m,  // Padrão que encontraria "58348252" no início da linha
    /\b(\d{8})\b/   // Qualquer número de 8 dígitos
  ];

  for (const pattern of idPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
};

// Função que extrai o nome do cliente
const extractCustomerName = (text: string): string => {
  const match = text.match(/Nome:?\s*([^\n]+)/i);
  return match ? match[1].trim() : '';
};

// Função que extrai o endereço
const extractAddress = (text: string): { street: string; number: string } => {
  const addressLine = text.match(/Endereco:\s*([^\n]+)/i);
  if (!addressLine) return { street: '', number: '' };
  
  const address = addressLine[1].trim();
  const numberMatch = address.match(/,?\s*(\d+)\s*$/);
  
  return {
    street: address.replace(/,?\s*\d+\s*$/, '').trim().toLowerCase(),
    number: numberMatch ? numberMatch[1] : ''
  };
};

// Função que extrai o bairro
const extractNeighborhood = (text: string): string => {
  const match = text.match(/Bairro:\s*([^\n\t]+?)(?:\s+(?:Comp|Endereco|CEP|Ref):|$)/i);
  return match ? match[1].trim().toLowerCase() : '';
};

// Função que extrai a cidade
const extractCity = (text: string): string => {
  const match = text.match(/Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i);
  return match ? match[1].trim() : '';
};

// Na função principal parseDeliveryData
export function parseDeliveryData(text: string): DeliveryData {
  const id = extractId(text);
  const customerName = extractCustomerName(text);
  const { street, number } = extractAddress(text);
  const neighborhood = extractNeighborhood(text);
  const city = extractCity(text);

  console.log("Dados extraídos:", {
    id,
    customerName,
    street,
    number,
    neighborhood,
    city
  });

  return {
    id,
    customerName,
    street,
    number,
    neighborhood,
    city
  };
} 