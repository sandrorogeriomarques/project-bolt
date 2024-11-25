import React, { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { ImagePreview } from '../components/ImagePreview';
import { DeliveryInfo } from '../components/DeliveryInfo';
import { ErrorMessage } from '../components/ErrorMessage';
import { parseDeliveryData } from '../utils/parseDeliveryData';
import { analyzeImage } from '../services/visionApi';
import type { DeliveryData } from '../types';
import { useUserStore } from '../stores/userStore';

export function Deliveries() {
  const user = useUserStore(state => state.user);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const objectUrl = URL.createObjectURL(file);
      const text = await analyzeImage(file);
      const parsedData = parseDeliveryData(text);
      
      if (!parsedData) {
        throw new Error('Não foi possível extrair as informações de entrega da imagem');
      }

      const newDelivery = {
        ...parsedData,
        imageUrl: objectUrl,
        timestamp: Date.now()
      };

      setDeliveries(prev => [...prev, newDelivery]);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError(error instanceof Error ? error.message : 'Falha ao processar imagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Entregas
        </h1>
        <p className="text-gray-600">
          Faça upload de cupons fiscais para extrair informações
        </p>
      </div>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      {deliveries.length > 0 && (
        <div className="space-y-6">
          {deliveries.map((delivery, index) => (
            <div key={`${delivery.id}-${delivery.timestamp}`} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Entrega #{deliveries.length - index}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImagePreview imageUrl={delivery.imageUrl} />
                <DeliveryInfo data={delivery} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Processando imagem...</span>
        </div>
      )}

      {/* Fixed Upload Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
        <div className="max-w-4xl mx-auto p-4 flex justify-center gap-4">
          <label className="flex-1">
            <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-600">Upload de Arquivo</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImage(file);
                }}
                disabled={isLoading}
              />
            </div>
          </label>

          <label className="flex-1">
            <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
              <Camera className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-600">Tirar Foto</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImage(file);
                }}
                disabled={isLoading}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
