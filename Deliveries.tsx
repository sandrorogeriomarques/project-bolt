interface Delivery {
  id: string;
  imageUrl: string;
  timestamp: number;
  customerName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  status: 'pending' | 'completed' | 'cancelled';
}

const processImage = async (file: File) => {
  try {
    console.log("Processando imagem:", file.name);
    console.log("Tipo:", file.type);
    console.log("Tamanho:", (file.size / 1024).toFixed(2) + "KB");

    const result = await performOCR(file);
    console.log("Resultado do OCR:", result);

    const extractedData = parseDeliveryData(result.text);
    console.log("Dados extraídos:", extractedData);

    // Verificar se o ID existe antes de criar nova entrega
    if (!extractedData.id) {
      throw new Error("ID do pedido não encontrado na imagem");
    }

    const newDelivery: Delivery = {
      id: extractedData.id,
      imageUrl: URL.createObjectURL(file),
      timestamp: Date.now(),
      customerName: extractedData.customerName,
      street: extractedData.street,
      number: extractedData.number,
      neighborhood: extractedData.neighborhood,
      city: extractedData.city,
      status: 'pending'
    };

    console.log("Nova entrega antes da validação:", newDelivery);

    // Validar se o ID foi realmente atribuído
    if (!newDelivery.id) {
      console.error("ID não encontrado. Dados completos:", { resultData: result, newDelivery });
      throw new Error("ID do pedido não encontrado na imagem");
    }

    return newDelivery;
  } catch (error) {
    console.error("Erro ao processar imagem:", error);
    throw error;
  }
}; 