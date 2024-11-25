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
        // ID do localizador do pedido (prioridade)
        /LOCALIZADOR[^:]*:?\s*(\d+\s*\d+)/i,
        // ID após telefone
        /Telefone:.*?ID:?\s*[^\d]*(\d+)/i,
        // ID após PEDIDO
        /PEDIDO[^:]*:?\s*#?(\d+)/i,
        // Outros formatos de ID
        /ID:?\s*(\d+)/i,
        /ENTREGA[^:]*:?\s*(\d+)/i,
        /NOTA[^:]*:?\s*(\d+)/i,
        /N[º°]?\s*(?:PEDIDO|NOTA)[^:]*:?\s*(\d+)/i
    ];

    for (const pattern of idPatterns) {
        const match = text.match(pattern);
        if (match) {
            // Remove espaços e caracteres especiais do ID
            id = match[1].replace(/[\s\-\.]+/g, '');
            console.log('ID encontrado:', id, 'usando pattern:', pattern);
            break;
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

    // Primeiro tenta encontrar a linha do endereço
    const addressLine = text.match(/Endereco:?\s*([^\n]+)(?:\n|$)/i);
    if (addressLine) {
        const addressText = addressLine[1].trim();
        console.log('Linha do endereço encontrada:', addressText);

        // Procura por número na próxima linha
        const nextLine = text.substring(text.indexOf(addressText) + addressText.length);
        const nextLineMatch = nextLine.match(/^\s*[\n\r]+\s*(\d+)/);
        
        if (nextLineMatch) {
            // Se encontrou número na próxima linha
            number = nextLineMatch[1];
            street = addressText.replace(/,\s*$/, ''); // Remove vírgula no final
            console.log('Número encontrado na próxima linha:', number);
        } else {
            // Tenta diferentes formatos na mesma linha
            const formats = [
                // Formato: Av, Visc, de Guarapuava, 1800
                /^([^,]+(?:,[^,]+)*),\s*(\d+)/,
                // Formato: R. Dona Alice Tibirica, 411
                /^([^,]+),\s*(\d+)/,
                // Formato: Rua Nome da Rua 123
                /^([^0-9]+)\s+(\d+)/,
            ];

            for (const format of formats) {
                const match = addressText.match(format);
                if (match) {
                    street = match[1].trim();
                    number = match[2].trim();
                    console.log('Formato de endereço encontrado:', { street, number }, 'usando pattern:', format);
                    break;
                }
            }

            // Se não encontrou em nenhum formato conhecido, tenta extrair o número do final
            if (!number) {
                const numberMatch = addressText.match(/(\d+)\s*$/);
                if (numberMatch) {
                    number = numberMatch[1];
                    street = addressText.replace(/,?\s*\d+\s*$/, '').trim();
                    console.log('Número extraído do final:', { street, number });
                }
            }
        }
    }

    // Se não encontrou o endereço completo, tenta padrões específicos
    if (!street || !number) {
        const addressPatterns = [
            // Padrão com "R." ou "Rua"
            /R(?:ua)?\.?\s*([^,\n\t]+)(?:,\s*n?[º°]?\s*(\d+))?/i,
            // Padrão com "Av." ou "Avenida"
            /Av(?:enida)?\.?\s*([^,\n\t]+)(?:,\s*n?[º°]?\s*(\d+))?/i,
            // Outros padrões
            /LOGRADOURO:?\s*([^,\n\t]+)(?:,\s*n?[º°]?\s*(\d+))?/i
        ];

        for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match) {
                street = match[1].trim();
                number = match[2] || '';
                console.log('Padrão específico encontrado:', { street, number }, 'usando pattern:', pattern);
                break;
            }
        }
    }

    // Limpa e padroniza o formato da rua
    if (street) {
        street = street
            .replace(/^R\./i, 'Rua')
            .replace(/^Av\./i, 'Avenida')
            .replace(/^Av,/i, 'Avenida')
            .replace(/\s+/g, ' ')
            .replace(/,\s*,/g, ',') // Remove vírgulas duplicadas
            .trim();

        // Remove vírgula no final se houver
        street = street.replace(/,\s*$/, '');
    }

    // Remove caracteres especiais do número
    if (number) {
        number = number.replace(/[^\d]/g, '');
    }

    console.log('Endereço final:', { street, number });

    // Extrair bairro
    let neighborhood = '';
    const neighborhoodPatterns = [
      /Bairro:?\s*([^\n-]+)(?:-[A-Z]{2})?/i,
      /B\.?\s*([^\n-]+)(?:-[A-Z]{2})?/i,
      /VILA:?\s*([^\n-]+)(?:-[A-Z]{2})?/i,
      /JARDIM:?\s*([^\n-]+)(?:-[A-Z]{2})?/i
    ];

    for (const pattern of neighborhoodPatterns) {
      const match = text.match(pattern);
      if (match) {
        neighborhood = match[1].trim();
        console.log('Bairro encontrado:', neighborhood, 'usando pattern:', pattern);
        break;
      }
    }

    // Extrair cidade
    let city = '';
    const cityPatterns = [
      /Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i,
      /([A-Z][a-zÀ-ú\s]+)(?:\s*-\s*([A-Z]{2}))/,
      /Municipio:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i,
      /Município:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i
    ];

    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match) {
        city = match[1].trim();
        if (match[2]) {
          city += ` - ${match[2]}`;
        }
        console.log('Cidade encontrada:', city, 'usando pattern:', pattern);
        break;
      }
    }

    const data: Partial<DeliveryData> = {
      id,
      customerName,
      street,
      number,
      neighborhood,
      city
    };

    console.log('Dados extraídos:', data);
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
      missingFields: ['Erro ao fazer parse']
    };
  }
}

// Parser específico para Google Vision
export function parseGoogleVisionData(text: string): ParseResult {
  try {
    console.log('=== Iniciando parse Google Vision ===');
    console.log('Texto recebido:', text);
    
    // Extrair ID
    let id = '';
    const idMatch = text.match(/ID:?\s*(\d+)/i) || 
                   text.match(/LOCALIZADOR[^:]*:?\s*(\d+\s*\d+)/i) ||
                   text.match(/PEDIDO[^:]*:?\s*(\d+)/i);
    if (idMatch) {
      id = idMatch[1].replace(/\s+/g, '');
      console.log('ID encontrado:', id);
    }

    // Extrair nome do cliente
    let customerName = '';
    const nameMatch = text.match(/Nome:?\s*([^\n]+)/i) ||
                     text.match(/Cliente:?\s*([^\n]+)/i) ||
                     text.match(/Destinatario:?\s*([^\n]+)/i);
    if (nameMatch) {
      customerName = nameMatch[1].trim();
      console.log('Nome do cliente encontrado:', customerName);
    }

    // Extrair endereço
    let street = '';
    let number = '';
    const addressMatch = text.match(/Endereco:?\s*([^,]+),?\s*([^,]+),?\s*n?[º°]?\s*(\d+)/i) ||
                        text.match(/R(?:ua)?[,.]?\s*([^,\n]+)[,\s]*n?[º°]?\s*(\d+)?/i) ||
                        text.match(/AV(?:enida)?[,.]?\s*([^,\n]+)[,\s]*n?[º°]?\s*(\d+)?/i);
    if (addressMatch) {
      street = addressMatch[1].trim();
      number = addressMatch[2] || '';
      console.log('Rua encontrada:', street);
      console.log('Número encontrado:', number);
    }

    // Extrair bairro
    let neighborhood = '';
    const neighborhoodMatch = text.match(/Bairro:?\s*([^\n-]+)(?:-[A-Z]{2})?/i) ||
                             text.match(/B\.?\s*([^\n-]+)(?:-[A-Z]{2})?/i);
    if (neighborhoodMatch) {
      neighborhood = neighborhoodMatch[1].trim();
      console.log('Bairro encontrado:', neighborhood);
    }

    // Extrair cidade
    let city = '';
    const cityMatch = text.match(/Cidade:?\s*([^\n-]+)(?:\s*-\s*([A-Z]{2}))?/i) ||
                     text.match(/([A-Z][a-zÀ-ú\s]+)(?:\s*-\s*([A-Z]{2}))/);
    if (cityMatch) {
      city = cityMatch[1].trim();
      if (cityMatch[2]) {
        city += ` - ${cityMatch[2]}`;
      }
      console.log('Cidade encontrada:', city);
    }

    // Extrair complemento
    let complement = '';
    const complementMatch = text.match(/Comp(?:lemento)?:?\s*([^\n]+)/i) ||
                          text.match(/Complemento:?\s*([^\n]+)/i);
    if (complementMatch) {
      complement = complementMatch[1].trim();
      console.log('Complemento encontrado:', complement);
    }

    // Extrair número do pedido
    let orderNumber = '';
    const orderMatch = text.match(/PEDIDO[:\s]+[#-]?(\d+)/i) ||
                      text.match(/N[º°]?\s*(?:do\s+)?(?:pedido|ped)[:\s]+[#-]?(\d+)/i);
    if (orderMatch) {
      orderNumber = orderMatch[1];
      console.log('Número do pedido encontrado:', orderNumber);
    }

    // Extrair data
    let orderDate = '';
    const dateMatch = text.match(/Data:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                     text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (dateMatch) {
      orderDate = dateMatch[1];
      console.log('Data encontrada:', orderDate);
    }

    // Extrair valor total
    let totalAmount: number | undefined;
    const totalMatch = text.match(/Total:?\s*R?\$?\s*(\d+[,.]\d{2})/i) ||
                      text.match(/Valor:?\s*R?\$?\s*(\d+[,.]\d{2})/i);
    if (totalMatch) {
      totalAmount = parseFloat(totalMatch[1].replace(',', '.'));
      console.log('Valor total encontrado:', totalAmount);
    }

    // Extrair loja
    let store = '';
    const storeMatch = text.match(/Loja:?\s*([^\n]+)/i) ||
                      text.match(/Estabelecimento:?\s*([^\n]+)/i);
    if (storeMatch) {
      store = storeMatch[1].trim();
      console.log('Loja encontrada:', store);
    }

    const data: Partial<DeliveryData> = {
      id,
      customerName,
      street,
      number,
      neighborhood,
      city,
      complement,
      orderNumber,
      orderDate,
      totalAmount,
      store
    };

    const missingFields = checkRequiredFields(data);
    console.log('=== Resultado do parse Google Vision ===');
    console.log('Campos encontrados:', data);
    console.log('Campos faltando:', missingFields);

    return {
      success: missingFields.length === 0,
      data,
      missingFields
    };
  } catch (error) {
    console.error('Erro no parse Google Vision:', error);
    return {
      success: false,
      data: {},
      missingFields: ['error']
    };
  }
}

// Função principal que será chamada externamente
export function parseDeliveryData(text: string, source: 'ocrspace' | 'googlevision' = 'ocrspace'): ParseResult {
  try {
    const parser = source === 'ocrspace' ? parseOcrSpaceData : parseGoogleVisionData;
    const result = parser(text);
    console.log('Campos faltando:', result.missingFields);
    return result;
  } catch (error) {
    console.error('Erro ao fazer parse dos dados:', error);
    return {
      success: false,
      data: {},
      missingFields: ['Erro ao fazer parse']
    };
  }
}