import { analyzeImageWithOcrSpace } from './ocrSpaceApi';
import { analyzeImageWithVision } from './visionApi';
import { parseDeliveryData } from '../utils/parseDeliveryData';
import { DeliveryData } from '../types';

interface OCRResult {
  text: string;
  source: 'ocrspace' | 'googlevision';
  data?: ReturnType<typeof parseDeliveryData>;
}

// Cache para controle de falhas do OCR.space
const ocrSpaceHealthCheck = {
  failures: 0,
  lastFailure: 0,
  cooldownPeriod: 5 * 60 * 1000, // 5 minutos
  maxFailures: 3, // Número máximo de falhas antes de entrar em cooldown
  
  recordFailure() {
    const now = Date.now();
    // Reseta o contador se já passou o período de cooldown desde a última falha
    if (now - this.lastFailure > this.cooldownPeriod) {
      this.failures = 0;
    }
    this.failures++;
    this.lastFailure = now;
  },
  
  shouldTryOcrSpace() {
    const now = Date.now();
    // Se está em cooldown, só tenta novamente após o período
    if (this.failures >= this.maxFailures) {
      return (now - this.lastFailure) > this.cooldownPeriod;
    }
    return true;
  },
  
  reset() {
    this.failures = 0;
    this.lastFailure = 0;
  }
};

export async function analyzeImageWithFallback(file: File): Promise<OCRResult> {
  let lastError: Error | null = null;
  
  // Verifica se deve tentar OCR.space
  if (ocrSpaceHealthCheck.shouldTryOcrSpace()) {
    console.log('=== Iniciando OCR.space ===');
    try {
      const result = await analyzeImageWithOcrSpace(file);
      
      if (result.data.success) {
        console.log('OCR.space extraiu os dados com sucesso!');
        ocrSpaceHealthCheck.reset(); // Reset o contador de falhas após sucesso
        return {
          text: result.text,
          source: 'ocrspace',
          data: {
            ...result.data,
            extractedBy: 'ocrspace'
          }
        };
      }
      
      // Se não conseguiu extrair todos os dados, registra como falha parcial
      lastError = new Error(`OCR.space: Não foi possível extrair todos os dados necessários. Campos faltando: ${result.data.missingFields.join(', ')}`);
      ocrSpaceHealthCheck.recordFailure();
      
    } catch (error) {
      console.error('Erro no OCR.space:', error);
      lastError = error;
      ocrSpaceHealthCheck.recordFailure();
      
      // Se for erro de rede, registra no localStorage para análise
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('network') ||
          error.message.includes('timeout')) {
        try {
          const networkErrors = JSON.parse(localStorage.getItem('ocrspace_network_errors') || '[]');
          networkErrors.push({
            timestamp: Date.now(),
            error: error.message
          });
          // Mantém apenas os últimos 50 erros
          if (networkErrors.length > 50) networkErrors.shift();
          localStorage.setItem('ocrspace_network_errors', JSON.stringify(networkErrors));
        } catch (e) {
          console.error('Erro ao salvar log de erros:', e);
        }
      }
    }
  } else {
    console.log('OCR.space em cooldown devido a falhas recentes. Aguardando período de recuperação...');
  }

  // Se chegou aqui, o OCR.space falhou ou está em cooldown
  console.log('=== Tentando Google Vision como fallback ===');
  try {
    const visionResult = await analyzeImageWithVision(file);
    const parsedData = parseDeliveryData(visionResult.text, 'googlevision');
    
    if (parsedData.success) {
      console.log('Google Vision extraiu os dados com sucesso!');
      return {
        text: visionResult.text,
        source: 'googlevision',
        data: {
          ...parsedData,
          extractedBy: 'googlevision'
        }
      };
    }
    
    throw new Error(`Google Vision: Não foi possível extrair todos os dados necessários. Campos faltando: ${parsedData.missingFields.join(', ')}`);
    
  } catch (visionError) {
    console.error('Erro no Google Vision:', visionError);
    
    // Se ambos os serviços falharam, retorna o erro mais relevante
    if (lastError?.message.includes('network') || lastError?.message.includes('timeout')) {
      throw new Error('Serviços OCR indisponíveis no momento. Por favor, tente novamente mais tarde.');
    } else {
      throw visionError; // Prioriza o erro do Vision se não for problema de rede
    }
  }
}
