'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoProvider: 'youtube' | 'vimeo' | 'direct' | 'custom';
  videoProviderId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ 
  videoProvider, 
  videoProviderId, 
  title,
  className = '',
  onProgress,
  onComplete 
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('VideoPlayer props:', {
    videoProvider,
    videoProviderId,
    title,
    className
  });

  // Validar datos de entrada
  const isValidVideoData = () => {
    if (!videoProvider || !videoProviderId) {
      console.warn('VideoPlayer: Missing video provider or ID');
      return false;
    }
    
    if (videoProvider === 'youtube' && !videoProviderId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      console.warn('VideoPlayer: Invalid YouTube video ID format');
      return false;
    }
    
    if (videoProvider === 'vimeo' && !videoProviderId.match(/^\d+$/)) {
      console.warn('VideoPlayer: Invalid Vimeo video ID format');
      return false;
    }
    
    return true;
  };

  // Generar URL del video según el proveedor
  const getVideoUrl = () => {
    let url = '';
    switch (videoProvider) {
      case 'youtube':
        url = `https://www.youtube.com/embed/${videoProviderId}?enablejsapi=1&origin=${window.location.origin}`;
        break;
      case 'vimeo':
        url = `https://player.vimeo.com/video/${videoProviderId}`;
        break;
      case 'direct':
        url = videoProviderId; // URL directa
        break;
      case 'custom':
        url = videoProviderId; // URL personalizada
        break;
      default:
        url = '';
    }
    
    console.log('Generated video URL:', url);
    return url;
  };

  // Manejar carga del iframe
  const handleIframeLoad = () => {
    console.log('VideoPlayer iframe loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  // Manejar errores del iframe
  const handleIframeError = () => {
    console.error('VideoPlayer iframe error');
    setIsLoading(false);
    setError('Error al cargar el video');
  };

  // Renderizar contenido según el proveedor
  const renderVideoContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">
              Proveedor: {videoProvider} | ID: {videoProviderId}
            </p>
          </div>
        </div>
      );
    }

    // Validar datos antes de generar URL
    if (!isValidVideoData()) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-yellow-500 mb-2">⚠️</div>
            <p className="text-gray-600 mb-2">Datos de video inválidos</p>
            <p className="text-sm text-gray-500">
              Proveedor: {videoProvider || 'No especificado'} | ID: {videoProviderId || 'No especificado'}
            </p>
          </div>
        </div>
      );
    }

    const videoUrl = getVideoUrl();
    
    if (!videoUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📹</div>
            <p className="text-gray-600">Video no disponible</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        
        <iframe
          src={videoUrl}
          title={title || 'Video de la lección'}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {renderVideoContent()}
    </div>
  );
}

// Componente específico para YouTube con controles personalizados
export function YouTubePlayer({ 
  videoId, 
  title,
  className = '',
  onProgress,
  onComplete 
}: {
  videoId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}) {
  return (
    <VideoPlayer
      videoProvider="youtube"
      videoProviderId={videoId}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
}

// Componente específico para Vimeo
export function VimeoPlayer({ 
  videoId, 
  title,
  className = '',
  onProgress,
  onComplete 
}: {
  videoId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}) {
  return (
    <VideoPlayer
      videoProvider="vimeo"
      videoProviderId={videoId}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
}

// Componente para videos directos
export function DirectVideoPlayer({ 
  videoUrl, 
  title,
  className = '',
  onProgress,
  onComplete 
}: {
  videoUrl: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}) {
  return (
    <VideoPlayer
      videoProvider="direct"
      videoProviderId={videoUrl}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
}
