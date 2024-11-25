import { analyzeImageWithOcrSpace } from './ocrSpaceApi';
import { analyzeImageWithVision } from './visionApi';
import { parseDeliveryData } from '../utils/parseDeliveryData';

interface OCRResult {
  text: string;
  source: 'ocrspace' | 'googlevision';
  data?: Partial<DeliveryData>;
}

export async function analyzeImageWithFallback(file: File): Promise<OCRResult> {
    console.log('=== Iniciando OCR.space ===');
    try {
        // Tenta primeiro com OCR.space
        const result = await analyzeImageWithOcrSpace(file);
        console.log('OCR.space retornou texto:\n', result);

        // Retorna o resultado direto do OCR.space que já inclui o parse
        if (result.data.success) {
            console.log('OCR.space extraiu os dados com sucesso!');
            return {
              text: result.text,
              source: 'ocrspace',
              data: result.data
            };
        }

        throw new Error(`Não foi possível extrair os dados necessários da imagem. Campos faltando: ${result.data.missingFields.join(', ')}`);

    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        throw error;
    }
}
