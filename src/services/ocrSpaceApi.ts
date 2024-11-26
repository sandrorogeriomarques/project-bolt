import { parseDeliveryData } from '../utils/parseDeliveryData';

const OCR_SPACE_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY;
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
const BACKUP_OCR_SPACE_API_URL = 'https://apipro1.ocr.space/parse/image'; // URL de backup

// Configurações
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  TIMEOUT: 45000,
  MAX_SIZE: 1024 * 1024,
  PROGRESSIVE_TIMEOUT: true
};

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

// Função para verificar conectividade com a internet
async function checkInternetConnection(): Promise<boolean> {
  try {
    await fetch('https://www.google.com/favicon.ico', {
      mode: 'no-cors',
      cache: 'no-store'
    });
    return true;
  } catch {
    return false;
  }
}

// Função para comprimir imagem se necessário
async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= CONFIG.MAX_SIZE) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Reduz o tamanho mantendo a proporção
      const ratio = Math.sqrt(CONFIG.MAX_SIZE / file.size);
      width *= ratio;
      height *= ratio;

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file); // Fallback para arquivo original
          }
        },
        'image/jpeg',
        0.7
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function analyzeImageWithOcrSpace(file: File): Promise<OcrResult> {
  try {
    // Validar o arquivo
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }

    // Comprimir imagem se necessário
    const processedFile = await compressImageIfNeeded(file);
    console.log('Tamanho da imagem após processamento:', (processedFile.size / 1024).toFixed(2) + 'KB');

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        // Verifica conexão com a internet antes de tentar
        const hasInternet = await checkInternetConnection();
        if (!hasInternet) {
          throw new Error('Sem conexão com a internet');
        }

        console.log(`Enviando imagem para OCR.space... (tentativa ${attempt}/${CONFIG.MAX_RETRIES})`);
        
        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('apikey', OCR_SPACE_API_KEY);
        formData.append('language', 'por');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');
        formData.append('isTable', 'true');
        formData.append('filetype', 'Auto');

        // Aumenta o timeout progressivamente a cada tentativa
        const timeout = CONFIG.PROGRESSIVE_TIMEOUT 
          ? CONFIG.TIMEOUT * Math.pow(1.5, attempt - 1)
          : CONFIG.TIMEOUT;

        // Tenta primeiro a URL principal, depois a de backup
        const apiUrl = attempt === 1 ? OCR_SPACE_API_URL : BACKUP_OCR_SPACE_API_URL;

        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        let data: OCRSpaceResponse;
        
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Erro ao fazer parse da resposta do OCR.space:', error);
          throw new Error('Resposta inválida do OCR.space');
        }

        if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
          throw new Error(`OCR.space processing error: ${data.ErrorMessage || data.ErrorDetails || 'Unknown error'}`);
        }

        if (!data.ParsedResults || data.ParsedResults.length === 0) {
          throw new Error('No text extracted from image');
        }

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

        const parsedData = parseDeliveryData(text);

        return {
          text,
          source: 'ocrspace' as const,
          data: parsedData
        };

      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, error);

        const isNetworkError = error.message.includes('Failed to fetch') || 
                             error.message.includes('network') ||
                             error.message.includes('timeout') ||
                             error.message.includes('connection');

        if (isNetworkError && attempt < CONFIG.MAX_RETRIES) {
          const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Backoff exponencial
          console.log(`Erro de rede, aguardando ${delay/1000}s antes de tentar novamente...`);
          await sleep(delay);
          continue;
        }

        if (attempt === CONFIG.MAX_RETRIES) {
          throw new Error(`OCR.space: Falha após ${CONFIG.MAX_RETRIES} tentativas - ${error.message}`);
        }

        await sleep(CONFIG.RETRY_DELAY);
      }
    }

    throw new Error('OCR.space: Todas as tentativas falharam');
  } catch (error) {
    console.error('Erro fatal OCR.space:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
