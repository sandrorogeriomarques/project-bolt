import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start justify-between">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-700"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}