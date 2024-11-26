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
  console.log('=== Linhas do texto ===');
  lines.forEach((line, index) => {
    console.log(`Linha ${index}: "${line}"`);
  });

  // Procura a linha que contém o endereço
  let addressLine = '';
  let nextLine = '';
  let addressIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/(?:^|\t)(?:Endereco|endereço|end\.?):/i)) {
      addressLine = lines[i];
      nextLine = lines[i + 1] || '';
      addressIndex = i;
      break;
    }
  }

  if (!addressLine) {
    throw new Error('Endereço não encontrado no texto');
  }

  console.log('=== Linha do endereço encontrada ===');
  console.log('Original:', addressLine);
  console.log('Próxima linha:', nextLine);

  // Função para limpar e normalizar o endereço
  function extractAddressFromLine(line: string): string {
    // Se a linha contém "Endereco:", extrai apenas a parte após isso
    if (line.includes('Endereco:')) {
      const parts = line.split('Endereco:');
      return parts[parts.length - 1].trim();
    }
    return line.trim();
  }

  function cleanAddressLine(address: string): string {
    return address
      // Remove prefixos comuns
      .replace(/(?:^|\t)(?:Endereco|endereço|end\.?):/i, '')
      // Remove "Bairro:" e variações no início ou meio do texto
      .replace(/(?:^|\s)(?:bairro|balrro|bai?r+o)\s*:\s*[^,\t]+(?:\t|\s*,\s*)/i, '')
      // Remove vírgulas extras
      .replace(/,+/g, ',')
      // Remove espaços extras
      .trim();
  }

  // Extrai apenas a parte do endereço da linha
  let fullAddress = extractAddressFromLine(addressLine);
  
  // Limpa o endereço de textos extras
  fullAddress = cleanAddressLine(fullAddress);
  
  // Sempre verifica a próxima linha para números
  if (nextLine) {
    const cleanNextLine = cleanAddressLine(nextLine);
    // Se a próxima linha contém apenas números ou é um número seguido de Bairro/Comp
    if (cleanNextLine.match(/^\d+\s*(?:$|Bairro:|Comp:)/i)) {
      fullAddress += ', ' + cleanNextLine.split(/\s+(?:Bairro:|Comp:)/)[0].trim();
    }
    // Se o endereço atual não tem vírgula ou número, e a próxima linha não começa com palavras-chave
    else if (!fullAddress.includes(',') && !fullAddress.match(/\d+/) && !cleanNextLine.match(/^(?:Bairro|Comp|CEP|Ref|Cidade):/i)) {
      fullAddress += ' ' + cleanNextLine.split(/\t|Bairro:/)[0].trim();
    }
  }

  console.log('Após extrair endereço:', fullAddress);

  // Normaliza abreviações comuns
  fullAddress = normalizeAddressAbbreviations(fullAddress);
  console.log('Após normalizar abreviações:', fullAddress);

  // Extrai número e nome da rua
  let street = '';
  let number = '';

  // Primeiro tenta encontrar o número após uma vírgula
  const commaNumberMatch = fullAddress.match(/,\s*(\d+)/);
  if (commaNumberMatch) {
    number = commaNumberMatch[1];
    street = fullAddress.substring(0, commaNumberMatch.index).trim();
  } else {
    // Se não encontrou após vírgula, procura por número no final ou após espaço
    const numberMatch = fullAddress.match(/[,\s](\d+)(?:\s*(?:Bairro|Comp|$))/i);
    if (numberMatch) {
      number = numberMatch[1];
      street = fullAddress.substring(0, numberMatch.index).trim();
    } else {
      // Último recurso: procura por qualquer número
      const anyNumberMatch = fullAddress.match(/(\d+)/);
      if (anyNumberMatch) {
        number = anyNumberMatch[1];
        const parts = fullAddress.split(number);
        street = parts[0].replace(/,\s*$/, '').trim();
      } else {
        street = fullAddress.replace(/,\s*$/, '').trim();
      }
    }
  }

  // Limpa novamente o nome da rua de possíveis textos extras
  street = street
    .replace(/(?:^|\s)(?:bairro|balrro|bai?r+o)\s*:\s*[^,\t]+(?:\t|\s*,\s*)/gi, '')
    .replace(/^\s*,\s*/, '')
    .trim();

  console.log('=== Resultado final ===');
  console.log('Rua:', street.toLowerCase());
  console.log('Número:', number);

  return {
    street: street.toLowerCase(),
    number
  };
};

// Função para normalizar abreviações de endereço
function normalizeAddressAbbreviations(address: string): string {
  const abbreviations: { [key: string]: string } = {
    'r\\.': 'rua',
    'av\\.': 'avenida',
    'al\\.': 'alameda',
    'bpo': 'bispo',
    'visc\\.': 'visconde',
    'gen\\.': 'general',
    'mal\\.': 'marechal'
  };

  // Aplica todas as normalizações de abreviações
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'i');
    address = address.replace(regex, full);
  }

  return address;
}

// Melhorada detecção de bairro
const findNeighborhood = (text: string): string | null => {
  const patterns = [
    // Padrão para "bairro" com possíveis erros de OCR
    /(?:^|\n|\t)(?:bairro|balrro|bai?r+o)\s*:\s*([^,\n\t]+?)(?:\s+(?:Comp|Endereco|CEP|Ref):|$)/i,
    // Padrão mais simples como fallback
    /(?:bairro|balrro|bai?r+o)\s*:\s*([^,\n]+)/i
  ];

  console.log('=== Procurando bairro ===');
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`Verificando linha: "${line.trim()}"`);
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const neighborhood = match[1].trim().toLowerCase();
      console.log(`Bairro encontrado: "${neighborhood}" usando pattern: ${pattern}`);
      return neighborhood;
    }
  }

  console.log('Nenhum bairro encontrado');
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
    let { street, number } = findAddressAndNumber(text);
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