import React from 'react';
import { ImageOff } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string | null;
}

export function ImagePreview({ imageUrl }: ImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <ImageOff className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg shadow-lg">
      <img
        src={imageUrl}
        alt="Receipt preview"
        className="w-full h-auto object-contain"
      />
    </div>
  );
}