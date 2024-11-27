import React from 'react';
import { MapPin, Store, Package } from 'lucide-react';
import { DeliveryData } from '../types';

interface DeliveryInfoProps {
  data: DeliveryData | null;
}

export function DeliveryInfo({ data }: DeliveryInfoProps) {
  if (!data) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="space-y-6">
        {/* Informações do Cliente */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Informações do Cliente</h2>
          </div>
          
          <div className="space-y-4">
            {data.customerName && (
              <p>
                <span className="font-medium">Cliente:</span> {data.customerName}
              </p>
            )}
            {data.deliveryPerson && (
              <p className="text-gray-700">
                <span className="font-semibold">Entregador:</span> {data.deliveryPerson.name}
              </p>
            )}
            <p className="text-gray-700">
              <span className="font-semibold">ID:</span> {data.id}
            </p>
            {data.street && (
              <p className="text-gray-700">
                <span className="font-semibold">Rua:</span> {data.street}
              </p>
            )}
            {data.number && (
              <p className="text-gray-700">
                <span className="font-semibold">Número:</span> {data.number}
              </p>
            )}
            {data.neighborhood && (
              <p className="text-gray-700">
                <span className="font-semibold">Bairro:</span> {data.neighborhood}
              </p>
            )}
            {data.city && (
              <p>
                <span className="font-medium">Cidade:</span> {data.city}
              </p>
            )}
            {data.complement && (
              <p className="text-gray-700">
                <span className="font-semibold">Complemento:</span> {data.complement}
              </p>
            )}
          </div>
        </section>

        {/* Informações do Pedido */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Informações do Pedido</h2>
          </div>

          <div className="space-y-4">
            {data.orderNumber && (
              <p className="text-gray-700">
                <span className="font-semibold">Número do Pedido:</span> {data.orderNumber}
              </p>
            )}
            {data.orderDate && (
              <p className="text-gray-700">
                <span className="font-semibold">Data do Pedido:</span> {data.orderDate}
              </p>
            )}
            {data.totalAmount && (
              <p className="text-gray-700">
                <span className="font-semibold">Valor Total:</span> {formatCurrency(data.totalAmount)}
              </p>
            )}
            <p>
              <span className="font-medium">Data de Registro:</span>{' '}
              {new Date(data.timestamp).toLocaleString()}
            </p>
            {data.extractedBy && (
              <p>
                <span className="font-medium">Extraída por:</span>{' '}
                {data.extractedBy === 'ocrspace' ? 'OCR.space' : 'Google Vision'}
              </p>
            )}
          </div>
        </section>

        {/* Informações da Loja */}
        {data.store && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Informações da Loja</h2>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Nome:</span> {data.store.name}
              </p>
              {data.store.cnpj && (
                <p className="text-gray-700">
                  <span className="font-semibold">CNPJ:</span> {data.store.cnpj}
                </p>
              )}
              {data.store.address && (
                <p className="text-gray-700">
                  <span className="font-semibold">Endereço:</span> {data.store.address}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}