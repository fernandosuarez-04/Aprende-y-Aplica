'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Cargar VideoPlayer dinámicamente sin SSR para evitar errores de window
const VideoPlayer = dynamic(() => import('../../core/components/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
      <div className="text-white">Cargando reproductor...</div>
    </div>
  )
});

export default function TestVideoSimplePage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Prueba Simple de VideoPlayer</h1>
        
        <div className="space-y-8">
          {/* Test con el ID de YouTube que proporcionaste */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test con ID de YouTube: BPdRvEnrZA8
            </h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <VideoPlayer
                videoProvider="youtube"
                videoProviderId="BPdRvEnrZA8"
                title="Test Video"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Test con datos de la lección real */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test con datos de lección real
            </h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <VideoPlayer
                videoProvider="youtube"
                videoProviderId="BPdRvEnrZA8"
                title="La IA en tu día a día: oportunidades que ya están aquí"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Test con datos inválidos */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test con datos inválidos (para verificar manejo de errores)
            </h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <VideoPlayer
                videoProvider="youtube"
                videoProviderId="invalid-id"
                title="Test Error"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Test sin datos */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test sin datos (para verificar fallback)
            </h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <VideoPlayer
                videoProvider="youtube"
                videoProviderId=""
                title="Test Empty"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
