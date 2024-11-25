import { parseDeliveryData } from '../utils/parseDeliveryData';

const OCR_SPACE_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY;
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';

if (!OCR_SPACE_API_KEY) {
  throw new Error('OCR.space API Key não encontrada. Por favor, configure a variável de ambiente VITE_OCR_SPACE_API_KEY');
}

interface OCRSpaceResponse {
  ParsedResults: Array<{
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage: string | null;
  ErrorDetails: string | null;
}

interface OcrResult {
  text: string;
  source: 'ocrspace';
  data: ReturnType<typeof parseDeliveryData>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeImageWithOcrSpace(file: File): Promise<OcrResult> {
  try {
    // Validar o arquivo
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }

    // Validar tamanho (máximo 1MB para a versão gratuita do OCR.space)
    const MAX_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      throw new Error('A imagem deve ter no máximo 1MB para o OCR.space');
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Enviando imagem para OCR.space... (tentativa ${attempt}/${MAX_RETRIES})`);
        console.log('Tamanho da imagem:', (file.size / 1024).toFixed(2) + 'KB');
        console.log('Tipo da imagem:', file.type);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('apikey', OCR_SPACE_API_KEY);
        formData.append('language', 'por'); // Portuguese
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // More accurate engine
        formData.append('isTable', 'true'); // Better for structured data like receipts
        formData.append('filetype', 'Auto');

        const response = await fetch(OCR_SPACE_API_URL, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000), // 30 segundos timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Resposta bruta do OCR.space:', responseText);

        let data: OCRSpaceResponse;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Erro ao fazer parse da resposta do OCR.space:', error);
          throw new Error('Resposta inválida do OCR.space');
        }

        console.log('OCR.space response:', data);

        if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
          throw new Error(`OCR.space processing error: ${data.ErrorMessage || data.ErrorDetails || 'Unknown error'}`);
        }

        if (!data.ParsedResults || data.ParsedResults.length === 0) {
          throw new Error('No text extracted from image');
        }

        // Extrair o texto de todos os ParsedResults
        const text = data.ParsedResults
          .map(result => {
            if (result.ErrorMessage || result.ErrorDetails) {
              console.warn('Warning in ParsedResult:', result.ErrorMessage || result.ErrorDetails);
            }
            return result.ParsedText;
          })
          .join('\n')
          .trim();

        if (!text) {
          throw new Error('No text extracted from image');
        }

        console.log('OCR.space texto extraído:', text.substring(0, 100) + '...');

        // Parse o texto extraído
        const parsedData = parseDeliveryData(text);

        return {
          text,
          source: 'ocrspace' as const,
          data: parsedData
        };

      } catch (error) {
        console.error('Erro detalhado OCR.space:', error);

        if (attempt === MAX_RETRIES) {
          throw new Error(`OCR.space processing error: ${error.message}`);
        }

        // Espera antes de tentar novamente
        console.log(`Tentativa ${attempt} falhou, aguardando ${RETRY_DELAY/1000}s antes de tentar novamente...`);
        await sleep(RETRY_DELAY);
      }
    }

    throw new Error('OCR.space: Todas as tentativas falharam');
  } catch (error) {
    console.error('Erro detalhado OCR.space:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
