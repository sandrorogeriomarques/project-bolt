import React from 'react';
import { MapPin } from 'lucide-react';
import { DeliveryData } from '../types';

interface DeliveryInfoProps {
  data: DeliveryData | null;
}

export function DeliveryInfo({ data }: DeliveryInfoProps) {
  if (!data) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Informações de Entrega</h2>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-semibold">ID:</span> {data.id}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Rua:</span> {data.street}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Número:</span> {data.number}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Bairro:</span> {data.neighborhood}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Cidade:</span> {data.city}
        </p>
        {data.complement && (
          <p className="text-gray-700">
            <span className="font-semibold">Complemento:</span> {data.complement}
          </p>
        )}
        <p className="text-gray-700">
          <span className="font-semibold">Data:</span>{' '}
          {new Date(data.timestamp).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}