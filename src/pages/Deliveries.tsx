import React, { useState, useEffect } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { ImagePreview } from '../components/ImagePreview';
import { DeliveryInfo } from '../components/DeliveryInfo';
import { ErrorMessage } from '../components/ErrorMessage';
import { parseDeliveryData } from '../utils/parseDeliveryData';
import { analyzeImage } from '../services/visionApi';
import type { DeliveryData } from '../types';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';

export function Deliveries() {
  const user = useUserStore(state => state.user);
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const processImage = async (file: File) => {
    if (!user) {
      setError('Usuário não autenticado');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const objectUrl = URL.createObjectURL(file);
      const text = await analyzeImage(file);
      
      // Log detalhado do texto OCR
      console.log('=== OCR Text Raw ===');
      console.log(text);
      console.log('=== OCR Text Lines ===');
      text.split('\n').forEach((line, i) => {
        console.log(`Line ${i + 1}:`, line);
      });
      
      const parsedData = parseDeliveryData(text);
      console.log('Parsed Data:', parsedData); // Debug log
      
      if (!parsedData) {
        throw new Error('Não foi possível extrair as informações de entrega da imagem');
      }

      const newDelivery: DeliveryData = {
        id: parsedData.id || `delivery-${Date.now()}`,
        imageUrl: objectUrl,
        timestamp: Date.now(),
        customerName: parsedData.customerName,
        street: parsedData.street,
        number: parsedData.number,
        neighborhood: parsedData.neighborhood,
        city: parsedData.city,
        complement: parsedData.complement,
        orderNumber: parsedData.orderNumber,
        orderDate: parsedData.orderDate,
        totalAmount: parsedData.totalAmount,
        store: parsedData.store,
        deliveryPerson: {
          id: user.id,
          name: user.name
        }
      };

      console.log('New Delivery:', newDelivery); // Debug log

      setDeliveries(prev => [...prev, newDelivery]);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError(error instanceof Error ? error.message : 'Falha ao processar imagem');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // ou um componente de loading/redirecionamento
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

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Processando imagem...</span>
          </div>
        </div>
      )}
    </div>
  );
}
