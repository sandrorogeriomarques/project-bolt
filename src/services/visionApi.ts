const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

if (!API_KEY) {
  throw new Error('Google Vision API Key não encontrada. Por favor, configure a variável de ambiente VITE_GOOGLE_VISION_API_KEY');
}

export async function analyzeImage(imageFile: File): Promise<string> {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);
  
  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image.split(',')[1] // Remove data URL prefix
        },
        features: [
          {
            type: 'TEXT_DETECTION'
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.responses[0]?.fullTextAnnotation?.text || '';
  } catch (error) {
    console.error('Error calling Vision API:', error);
    throw new Error('Failed to analyze image');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}