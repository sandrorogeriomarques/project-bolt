import React, { useState } from 'react';
import { analyzeImageWithFallback } from '../services/ocrService';
import { DeliveryInfo } from './DeliveryInfo';
import { DeliveryData } from '../types';
import { Upload } from 'lucide-react';

export function Deliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Processando imagem:', file.name);
      console.log('Tipo:', file.type);
      console.log('Tamanho:', (file.size / 1024).toFixed(2) + 'KB');

      const resultData = await analyzeImageWithFallback(file);
      console.log('Resultado do OCR:', resultData);
      
      if (!resultData.data) {
        throw new Error('Dados não encontrados na imagem');
      }

      // Criar URL para preview da imagem
      const imageUrl = URL.createObjectURL(file);

      // Criar nova entrega com os dados extraídos
      const newDelivery: DeliveryData = {
        id: resultData.data.id,
        customerName: resultData.data.customerName,
        street: resultData.data.street,
        number: resultData.data.number,
        neighborhood: resultData.data.neighborhood,
        city: resultData.data.city,
        complement: resultData.data.complement,
        imageUrl,
        timestamp: Date.now(),
        source: resultData.source
      };

      console.log('Nova entrega:', newDelivery);

      if (!newDelivery.id) {
        console.log('ID não encontrado. Dados completos:', { resultData, newDelivery });
        throw new Error('ID do pedido não encontrado na imagem');
      }

      // Adicionar nova entrega à lista
      setDeliveries(prev => [newDelivery, ...prev]);

    } catch (error) {
      console.log('Erro ao processar imagem:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <label
          htmlFor="image-upload"
          className={`
            flex items-center justify-center w-full
            px-4 py-2 border-2 border-dashed rounded-lg
            cursor-pointer transition-colors
            ${loading
              ? 'bg-gray-100 border-gray-300'
              : 'hover:bg-blue-50 border-blue-300 hover:border-blue-400'
            }
          `}
        >
          <div className="flex flex-col items-center p-6">
            <Upload className="w-8 h-8 mb-2 text-blue-500" />
            <span className="text-sm text-gray-600">
              {loading ? 'Processando...' : 'Clique para selecionar uma imagem'}
            </span>
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <DeliveryInfo key={delivery.id} data={delivery} />
        ))}
      </div>
    </div>
  );
}
