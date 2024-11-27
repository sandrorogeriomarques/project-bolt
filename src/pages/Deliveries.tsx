import React, { useState, useEffect } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { ImagePreview } from '../components/ImagePreview';
import { DeliveryInfo } from '../components/DeliveryInfo';
import { ErrorMessage } from '../components/ErrorMessage';
import { parseDeliveryData } from '../utils/parseDeliveryData';
import { analyzeImageWithFallback } from '../services/ocrService';
import type { DeliveryData } from '../types';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';

export function Deliveries() {
  const user = useUserStore(state => state.user);
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState<string>('OCR.space');
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const processImage = async (file: File) => {
    try {
      setIsLoading(true);
      setError('');

      // Validar o arquivo
      if (!file) {
        throw new Error('Nenhum arquivo selecionado');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      const MAX_SIZE = 1024 * 1024; // 1MB
      if (file.size > MAX_SIZE) {
        throw new Error('A imagem deve ter no máximo 1MB');
      }

      console.log('Processando imagem:', file.name);
      console.log('Tipo:', file.type);
      console.log('Tamanho:', (file.size / 1024).toFixed(2) + 'KB');

      const result = await analyzeImageWithFallback(file);
      console.log('Resultado do OCR:', result);

      if (!result.data) {
        throw new Error('Não foi possível extrair os dados da imagem');
      }

      console.log('Dados extraídos:', result.data);

      // Criar nova entrega usando o ID do pedido
      const newDelivery: DeliveryData = {
        id: result.data.data?.id || '',  
        imageUrl: URL.createObjectURL(file),
        timestamp: Date.now(),
        customerName: result.data.data?.customerName || '',
        street: result.data.data?.street || '',
        number: result.data.data?.number || '',
        neighborhood: result.data.data?.neighborhood || '',
        city: result.data.data?.city || '',
        complement: result.data.data?.complement || '',
        orderNumber: result.data.data?.orderNumber || '',
        orderDate: result.data.data?.orderDate || '',
        totalAmount: result.data.data?.totalAmount,
        store: result.data.data?.store || '',
        extractedBy: result.data.extractedBy,  
        deliveryPerson: {
          id: '25',
          name: 'Meu claro Principal'
        }
      };

      console.log('Nova entrega antes da validação:', newDelivery);

      // Validar ID
      if (!newDelivery.id) {
        console.error('ID não encontrado. Dados completos:', {
          resultData: result.data,
          newDelivery
        });
        throw new Error('ID do pedido não encontrado na imagem');
      }

      console.log('Nova entrega:', newDelivery);
      setDeliveries(prev => [...prev, newDelivery]);
      setError('');
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError(error.message || 'Erro ao processar imagem');
      setDeliveryData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

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

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-center text-gray-600">
              Processando imagem com {currentService}...
            </p>
          </div>
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="space-y-6">
          {deliveries.map((delivery, index) => (
            <div key={`${delivery.id}-${delivery.timestamp}`} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Entrega #{index + 1}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImagePreview imageUrl={delivery.imageUrl} />
                <DeliveryInfo data={delivery} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-4">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files?.[0] && processImage(e.target.files[0])}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600">Upload de Imagem</span>
            </div>
          </label>

          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => e.target.files?.[0] && processImage(e.target.files[0])}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
              <Camera className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600">Tirar Foto</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
