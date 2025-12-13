'use client';

import React, { useState } from 'react';
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

const YouTubePlayer = dynamic(() => import('../../core/components/VideoPlayer').then(mod => ({ default: mod.YouTubePlayer })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
      <div className="text-white">Cargando reproductor...</div>
    </div>
  )
});

const VimeoPlayer = dynamic(() => import('../../core/components/VideoPlayer').then(mod => ({ default: mod.VimeoPlayer })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
      <div className="text-white">Cargando reproductor...</div>
    </div>
  )
});

const DirectVideoPlayer = dynamic(() => import('../../core/components/VideoPlayer').then(mod => ({ default: mod.DirectVideoPlayer })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
      <div className="text-white">Cargando reproductor...</div>
    </div>
  )
});

export default function TestVideoPage() {
  const [selectedProvider, setSelectedProvider] = useState<'youtube' | 'vimeo' | 'direct' | 'custom'>('youtube');
  const [videoId, setVideoId] = useState('BPdRvEnrZA8'); // ID del video de ejemplo que proporcionaste

  const testVideos = {
    youtube: 'BPdRvEnrZA8',
    vimeo: '148751763',
    direct: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    custom: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Prueba de VideoPlayer</h1>
        
        {/* Selector de proveedor */}
        <div className="mb-8">
          <label className="block text-white mb-4">Selecciona un proveedor de video:</label>
          <div className="flex gap-4 mb-4">
            {(['youtube', 'vimeo', 'direct', 'custom'] as const).map((provider) => (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedProvider === provider
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Video ID/URL:</label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              placeholder="Ingresa el ID del video o URL"
            />
          </div>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Video Player - {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
          </h2>
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <VideoPlayer
              videoProvider={selectedProvider}
              videoProviderId={videoId}
              title="Video de prueba"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Ejemplos específicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">YouTube Player</h3>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <YouTubePlayer
                videoId="BPdRvEnrZA8"
                title="Video de YouTube"
                className="w-full h-full"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Vimeo Player</h3>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <VimeoPlayer
                videoId="148751763"
                title="Video de Vimeo"
                className="w-full h-full"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Direct Video Player</h3>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <DirectVideoPlayer
                videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                title="Video directo"
                className="w-full h-full"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Custom Video Player</h3>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <DirectVideoPlayer
                videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                title="Video personalizado"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Información de prueba */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Información de Prueba</h3>
          <div className="text-gray-300 space-y-2">
            <p><strong>YouTube:</strong> Usa el ID del video (ej: BPdRvEnrZA8)</p>
            <p><strong>Vimeo:</strong> Usa el ID numérico del video (ej: 148751763)</p>
            <p><strong>Direct:</strong> Usa la URL completa del video (ej: https://example.com/video.mp4)</p>
            <p><strong>Custom:</strong> Usa la URL completa del video personalizado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
