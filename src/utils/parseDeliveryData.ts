import { DeliveryData } from '../types';

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

// Parser específico para OCR.space
export function parseOcrSpaceData(text: string): ParseResult {
  try {
    console.log('=== Iniciando parse OCR.space ===');
    console.log('Texto recebido:', text);
    
    // Extrair ID
    let id = '';
    const idPatterns = [
      // ID após telefone (em nova linha)
      /Telefone:.*?ID:?\s*[^\S\r\n]*[\r\n]+\s*(\d+)/i,
      // ID antes do telefone (em linha isolada)
      /^(\d{8})(?:\s*Telefone:)/m,
      // ID em linha isolada (entre Nome e Telefone)
      /Nome:.*[\r\n]+\s*(\d{8})\s*[\r\n]+\s*Telefone:/is,
      // ID em linha isolada (após telefone)
      /^\s*(\d{6,})\s*$/m,
      // ID após telefone (mesma linha)
      /Telefone:.*?ID:?\s*[^\d]*(\d+)/i,
      // ID do localizador do pedido
      /LOCALIZADOR[^:]*:?\s*(\d+\s*\d+)/i,
      // Código de coleta
      /CODIGO\s+DE\s+COLETA[^:]*:?\s*(\d+)/i,
      // ID após PEDIDO (apenas se tiver 6+ dígitos)
      /PEDIDO[^:]*:?\s*#?(\d{6,})/i,
      // Outros formatos de ID (apenas se tiver 6+ dígitos)
      /ID:?\s*(\d{6,})/i,
      /ENTREGA[^:]*:?\s*(\d{6,})/i,
      /NOTA[^:]*:?\s*(\d{6,})/i,
      /N[º°]?\s*(?:PEDIDO|NOTA)[^:]*:?\s*(\d{6,})/i
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Remove espaços e caracteres especiais do ID
        id = match[1].replace(/[\s\-\.]+/g, '');
        // Verifica se o ID tem pelo menos 6 dígitos
        if (id.length >= 6) {
          console.log('ID encontrado:', id, 'usando pattern:', pattern);
          break;
        } else {
          console.log('ID ignorado por ser muito curto:', id);
          id = '';
        }
      }
    }

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

    // Extrair endereço
    let street = '';
    let number = '';
    let complement = '';

    // Primeiro tenta encontrar a linha do endereço
    const addressLine = text.match(/Endereco:?\s*([^\n]+)(?:\n|$)/i);
    if (addressLine) {
      const addressText = addressLine[1].trim();
      console.log('Linha do endereço encontrada:', addressText);

      // Procura por número na próxima linha ou no mesmo texto
      const numberInNextLine = text.substring(text.indexOf(addressText) + addressText.length).match(/^\s*[\n\r]+\s*(\d+)/);
      const numberInSameLine = addressText.match(/,\s*(\d+)\s*$/);
      
      if (numberInNextLine) {
        // Se encontrou número na próxima linha
        number = numberInNextLine[1];
        street = addressText.replace(/,\s*$/, ''); // Remove vírgula no final
        console.log('Número encontrado na próxima linha:', number);
      } else if (numberInSameLine) {
        // Se encontrou número na mesma linha após vírgula
        number = numberInSameLine[1];
        street = addressText.substring(0, addressText.lastIndexOf(',')).trim();
        console.log('Número encontrado na mesma linha:', number);
      } else {
        // Tenta outros padrões de endereço
        const addressParts = addressText.match(/^([^,]+(?:,[^,]+)*),\s*(\d+)/);
        if (addressParts) {
          street = addressParts[1].trim();
          number = addressParts[2];
          console.log('Formato de endereço encontrado:', { street, number }, 'usando pattern:', /^([^,]+(?:,[^,]+)*),\s*(\d+)/);
        }
      }
    }

    // Extrair complemento
    const complementPatterns = [
      /Comp:?\s*([^\n]+)/i,
      /Complemento:?\s*([^\n]+)/i,
      /Apto?\.?:?\s*([^\n]+)/i,
      /Apartamento:?\s*([^\n]+)/i,
    ];

    for (const pattern of complementPatterns) {
      const match = text.match(pattern);
      if (match) {
        complement = match[1].trim();
        console.log('Complemento encontrado:', complement, 'usando pattern:', pattern);
        break;
      }
    }

    // Normalizar endereço
    if (street) {
      // Adiciona prefixo "Rua" se não houver tipo de logradouro
      if (!street.match(/^(Rua|R\.|Av\.|Avenida|Travessa|Rod\.|Rodovia|Alameda|Al\.|Praça|Praca)/i)) {
        street = 'Rua ' + street;
      }
      // Expande abreviações comuns
      street = street
        .replace(/^R\./i, 'Rua')
        .replace(/^Av\./i, 'Avenida')
        .replace(/^Al\./i, 'Alameda')
        .replace(/^Rod\./i, 'Rodovia');
    }

    // Extrair bairro
    let neighborhood = '';
    const neighborhoodMatch = text.match(/Bairro:?\s*([^\n-]+)(?:-[A-Z]{2})?/i);
    if (neighborhoodMatch) {
      neighborhood = neighborhoodMatch[1].trim();
      // Remove possíveis dados de endereço que vieram junto
      neighborhood = neighborhood.split(/\s+Endereco/i)[0].trim();
      console.log('Bairro encontrado:', neighborhood, 'usando pattern:', /Bairro:?\s*([^\n-]+)(?:-[A-Z]{2})?/i);
    }

    // Extrair cidade
    let city = '';
    let state = '';
    const cityMatch = text.match(/Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i);
    if (cityMatch) {
      city = cityMatch[1].trim();
      state = cityMatch[2] || '';
      console.log('Cidade encontrada:', city + (state ? ' - ' + state : ''), 'usando pattern:', /Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i);
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