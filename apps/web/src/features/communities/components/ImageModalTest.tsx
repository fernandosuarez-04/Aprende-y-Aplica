'use client';

import React, { useState } from 'react';
import { AttachmentImage } from './OptimizedImage';

export function ImageModalTest() {
  const [testImage] = useState('https://picsum.photos/800/600');

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <h1 className="text-white text-2xl mb-6">Test de Modal de Imagen</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-white text-lg mb-2">Imagen de Adjunto (con modal)</h2>
          <AttachmentImage
            src={testImage}
            alt="Imagen de prueba"
            className="w-full max-w-md rounded-lg"
            showModal={true}
            fileName="imagen-prueba.jpg"
            attachmentData={{
              size: 1024000,
              mimeType: 'image/jpeg'
            }}
          />
        </div>

        <div>
          <h2 className="text-white text-lg mb-2">Imagen de Post (con modal)</h2>
          <AttachmentImage
            src={testImage}
            alt="Imagen de post"
            className="w-full max-w-md rounded-lg"
            showModal={true}
            fileName="post-image.jpg"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-white mb-2">Instrucciones:</h3>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Haz click en cualquier imagen para abrir el modal</li>
          <li>• El modal debe mostrar la imagen en pantalla completa</li>
          <li>• Debe tener botones de descarga y cerrar</li>
          <li>• Debe mostrar información del archivo</li>
        </ul>
      </div>
    </div>
  );
}
