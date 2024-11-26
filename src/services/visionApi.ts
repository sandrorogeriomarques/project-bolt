const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const getApiKey = () => import.meta.env.VITE_GOOGLE_VISION_API_KEY;

interface VisionResult {
  text: string;
  confidence?: number;
}

export async function analyzeImageWithVision(file: File): Promise<VisionResult> {
  try {
    const text = await analyzeImage(file);
    return {
      text,
      confidence: 0.9 // Google Vision não fornece confiança por texto, usando valor padrão alto
    };
  } catch (error) {
    console.error('Erro no Google Vision:', error);
    throw new Error(`Erro ao processar imagem com Google Vision: ${error.message}`);
  }
}

export async function analyzeImage(imageFile: File): Promise<string> {
  try {
    const API_KEY = getApiKey();
    if (!API_KEY) {
      throw new Error('Google Vision API Key não encontrada. Por favor, configure a variável de ambiente VITE_GOOGLE_VISION_API_KEY');
    }

    // Validar o arquivo
    if (!imageFile) {
      throw new Error('Nenhum arquivo fornecido');
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }

    // Validar tamanho (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > MAX_SIZE) {
      throw new Error('A imagem deve ter no máximo 10MB');
    }

    console.log('Convertendo imagem para base64...');
    const base64Image = await fileToBase64(imageFile);
    console.log('Imagem convertida com sucesso');

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image.split(',')[1] // Remove data URL prefix
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ],
          imageContext: {
            languageHints: ['pt-BR', 'pt', 'en']
          }
        }
      ]
    };

    console.log('Enviando requisição para Google Vision API...');
    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Vision API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    console.log('Resposta recebida da API');
    const data = await response.json();
    
    if (!data.responses || !data.responses[0]) {
      console.error('Resposta inesperada da API:', data);
      throw new Error('Resposta inválida da API');
    }

    const text = data.responses[0]?.fullTextAnnotation?.text;
    if (!text) {
      console.warn('Nenhum texto encontrado na imagem');
      throw new Error('Nenhum texto encontrado na imagem');
    }

    console.log('Texto extraído com sucesso:', text.substring(0, 100) + '...');
    return text;
  } catch (error) {
    console.error('Erro detalhado ao analisar imagem:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
  });
}