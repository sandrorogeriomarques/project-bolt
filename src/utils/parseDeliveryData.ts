import { DeliveryData } from '../types';
import { AddressParser } from './addressParser';

interface ParseResult {
  success: boolean;
  data: Partial<DeliveryData>;
  missingFields: string[];
}

// Função auxiliar para verificar campos obrigatórios
function checkRequiredFields(data: Partial<DeliveryData>): string[] {
  const requiredFields = ['id', 'street', 'number', 'neighborhood', 'city'];
  const missingFields = requiredFields.filter(field => {
    if (field === 'id') {
      return !data.id;
    }
    if (field === 'street') {
      return !data.street;
    }
    if (field === 'number') {
      return !data.number;
    }
    if (field === 'neighborhood') {
      return !data.neighborhood;
    }
    if (field === 'city') {
      return !data.city;
    }
    return false;
  });
  return missingFields;
}

// Melhorada detecção de ID para incluir mais formatos
const findId = (text: string): string | null => {
  const patterns = [
    // ID após telefone
    /Telefone:.*?ID:?\s*[^\S\r\n]*[\r\n]+\s*(\d+)/i,
    // ID antes do telefone
    /^(\d{8})(?:\s*Telefone:)/m,
    // ID em linha isolada
    /^[^\S\r\n]*(\d{8})[^\S\r\n]*$/m,
    // ID no formato localizador
    /LOCALIZADOR[^:]*:\s*(\d+\s*\d+)/i,
    // ID após telefone na mesma linha
    /Telefone:.*?ID:?\s*(\d+)/i,
    // ID em qualquer lugar após telefone
    /Telefone:.*[\r\n]+(?:.*[\r\n]+)*?\s*(\d{8})\s*[\r\n]/is
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const id = match[1].replace(/\s+/g, '');
      if (id.length >= 6) {
        return id;
      }
    }
  }
  return null;
}

// Melhorada extração de endereço e número
const findAddressAndNumber = (text: string): { street: string | null; number: string | null } => {
  const lines = text.split('\n');
  let addressLine = '';
  let number = null;

  // Debug: Imprime todas as linhas
  console.log('=== Linhas do texto ===');
  lines.forEach((line, i) => console.log(`Linha ${i}: "${line.trim()}"`));

  // Primeiro procura por endereço completo com número
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    if (line.match(/Endereco\s*:/i) || line.match(/Rua\s*:/i)) {
      console.log('=== Linha do endereço encontrada ===');
      console.log('Original:', line);
      
      // Extrai a parte do endereço após "Endereco:" ou "Rua:"
      const addressMatch = line.match(/(?:Endereco|Rua)\s*:\s*(.+)$/i);
      if (addressMatch) {
        addressLine = addressMatch[1].trim();
      }
      
      console.log('Após extrair endereço:', addressLine);
      
      // Se encontrou R. Bpo, normaliza para "rua bispo"
      if (addressLine.match(/\b(r\.|rua)\s+bpo\b/i)) {
        addressLine = addressLine.replace(/\b(r\.|rua)\s+bpo\b/i, 'rua bispo');
      }
      
      console.log('Após normalizar rua:', addressLine);
      
      // Procura número na mesma linha
      const numberInLine = addressLine.match(/,\s*(\d+)/);
      if (numberInLine) {
        number = numberInLine[1];
        addressLine = addressLine.replace(/,\s*\d+.*$/, '').trim();
      }
      
      // Procura número na próxima linha
      else if (nextLine.match(/^\d+$/)) {
        number = nextLine;
      }
      
      // Procura número em linha separada após vírgula
      else if (nextLine.match(/^[^,]+,\s*(\d+)/)) {
        const numberMatch = nextLine.match(/^[^,]+,\s*(\d+)/);
        if (numberMatch) {
          number = numberMatch[1];
          addressLine = `${addressLine} ${nextLine.replace(/,\s*\d+.*$/, '')}`;
        }
      }
      
      break;
    }
  }

  // Normaliza o endereço final
  if (addressLine) {
    addressLine = addressLine
      .toLowerCase()
      .replace(/\s+/g, ' ')  // Remove espaços extras
      .replace(/,\s*$/, '')  // Remove vírgula no final
      .trim();
  }

  console.log('=== Resultado final ===');
  console.log('Rua:', addressLine);
  console.log('Número:', number);

  return {
    street: addressLine || null,
    number: number
  };
};

// Melhorada detecção de bairro
const findNeighborhood = (text: string): string | null => {
  const patterns = [
    /(?:^|\n|\t)Bairro\s*:\s*([^,\n\t]+?)(?:\s+(?:Comp|Endereco|CEP):|$)/i,
    /Bairro\s*:\s*([^,\n]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().toLowerCase();
    }
  }

  return null;
};

// Parser específico para OCR.space
export function parseOcrSpaceData(text: string): ParseResult {
  try {
    console.log('=== Iniciando parse OCR.space ===');
    console.log('Texto recebido:', text);
    
    // Extrair ID
    const id = findId(text);
    console.log('ID encontrado:', id);

    // Extrair nome do cliente
    let customerName = '';
    const namePatterns = [
      /Nome:?\s*([^\n]+)/i,
      /Cliente:?\s*([^\n]+)/i,
      /Destinatario:?\s*([^\n]+)/i,
      /Destinatário:?\s*([^\n]+)/i,
      /ENTREGAR\s+(?:PARA|A):?\s*([^\n]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        customerName = match[1].trim();
        console.log('Nome do cliente encontrado:', customerName, 'usando pattern:', pattern);
        break;
      }
    }

    // Extrair endereço e número
    const { street, number } = findAddressAndNumber(text);
    console.log('Endereço encontrado:', street, 'Número encontrado:', number);

    // Extrair complemento
    let complement = '';
    const complementPatterns = [
      /(?:^|\n|\t)Comp:?\s*([^\n\t]+?)(?:\s+Bairro:|\s*$)/i,
      /(?:^|\n|\t)Complemento:?\s*([^\n\t]+?)(?:\s+Bairro:|\s*$)/i,
      /(?:^|\n|\t)Apto?\.?:?\s*([^\n\t]+?)(?:\s+Bairro:|\s*$)/i,
      /(?:^|\n|\t)Apartamento:?\s*([^\n\t]+?)(?:\s+Bairro:|\s*$)/i,
    ];

    for (const pattern of complementPatterns) {
      const match = text.match(pattern);
      if (match) {
        complement = match[1].trim();
        console.log('Complemento encontrado:', complement, 'usando pattern:', pattern);
        break;
      }
    }

    // Se encontramos um número que parece ser um apartamento/complemento
    // e não encontramos o número do endereço, usar como número
    if (!number && complement && /^\d+$/.test(complement)) {
      number = complement;
      complement = '';
      console.log('Usando complemento como número:', number);
    }

    // Extrair bairro
    const neighborhood = findNeighborhood(text);
    console.log('Bairro encontrado:', neighborhood);

    // Extrair cidade e estado
    let city = '';
    let state = '';
    const cityPatterns = [
      /Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i,
      /City:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i,
      /Cldade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i  // Corrigir erro comum de OCR
    ];

    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match) {
        city = match[1].trim();
        state = match[2] || '';
        console.log('Cidade encontrada:', city, state ? `- ${state}` : '', 'usando pattern:', pattern);
        break;
      }
    }

    // Se não encontrou o estado junto com a cidade, procurar separadamente
    if (!state) {
      const stateMatch = text.match(/(?:Estado|UF|State):?\s*([A-Z]{2})/i);
      if (stateMatch) {
        state = stateMatch[1].toUpperCase();
        console.log('Estado encontrado separadamente:', state);
      }
    }

    const data: Partial<DeliveryData> = {
      id,
      customerName,
      street,
      number,
      neighborhood,
      city: city + (state ? ' - ' + state : ''),
      complement
    };

    console.log('Dados extraídos:', data);

    // Verificar campos obrigatórios
    const missingFields = checkRequiredFields(data);
    console.log('Campos faltando:', missingFields);

    return {
      success: missingFields.length === 0,
      data,
      missingFields
    };
  } catch (error) {
    console.error('Erro ao fazer parse dos dados:', error);
    return {
      success: false,
      data: {},
      missingFields: ['error']
    };
  }
}

// Parser específico para Google Vision
export function parseGoogleVisionData(text: string): ParseResult {
  return parseOcrSpaceData(text); // Por enquanto, usa o mesmo parser
}

// Função principal que será chamada externamente
export function parseDeliveryData(text: string, source: 'ocrspace' | 'googlevision' = 'ocrspace'): ParseResult {
  const result = source === 'ocrspace' ? parseOcrSpaceData(text) : parseGoogleVisionData(text);
  
  console.log('Campos faltando:', result.missingFields);
  
  return result;
}