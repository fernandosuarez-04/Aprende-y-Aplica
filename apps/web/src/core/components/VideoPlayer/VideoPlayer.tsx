'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CustomVideoPlayer } from '../CustomVideoPlayer/CustomVideoPlayer';

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
  const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata'); // Cambiado a 'metadata' por defecto
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Detectar si estamos en móvil y ajustar estrategia de preload
  useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth < 768;
    };
    
    // En móviles, usar 'metadata' para que el video empiece a cargar inmediatamente
    // Esto reduce el tiempo de espera cuando el usuario hace clic en play
    if (checkMobile()) {
      setPreloadStrategy('metadata');
    } else {
      setPreloadStrategy('metadata');
    }
  }, []);

  // Timeout para ocultar el loader si el video tarda mucho en cargar
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // Ocultar loader después de 5 segundos máximo
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Manejar interacción del usuario
  const handleUserInteraction = () => {
    setHasUserInteracted(true);
  };

  // Debug logging
  // Validar datos de entrada
  const isValidVideoData = () => {
    if (!videoProvider || !videoProviderId) {
      return false;
    }
    
    if (videoProvider === 'youtube' && !videoProviderId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return false;
    }
    
    if (videoProvider === 'vimeo' && !videoProviderId.match(/^\d+$/)) {
      return false;
    }
    
    return true;
  };

  // Generar URL del video según el proveedor
  const getVideoUrl = () => {
    let url = '';
    switch (videoProvider) {
      case 'youtube':
        // Verificar si window está disponible (solo en el navegador)
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        url = `https://www.youtube.com/embed/${videoProviderId}?enablejsapi=1${origin ? `&origin=${origin}` : ''}`;
        break;
      case 'vimeo':
        url = `https://player.vimeo.com/video/${videoProviderId}`;
        break;
      case 'direct':
      case 'custom':
        // Para videos directos de Supabase, reconstruir la URL completa si es necesario
        url = videoProviderId;
        
        // Si la URL es relativa (no empieza con http), reconstruirla
        if (url && !url.startsWith('http')) {
          try {
            const supabase = createClient();
            // Intentar obtener la URL pública usando Supabase client
            // Si el path no incluye el bucket, asumir que está en 'course-videos/videos'
            let filePath = url;
            if (!filePath.includes('/')) {
              filePath = `videos/${filePath}`;
            } else if (!filePath.startsWith('course-videos/')) {
              // Si no empieza con 'course-videos/', agregarlo
              if (!filePath.startsWith('videos/')) {
                filePath = `videos/${filePath}`;
              }
            }
            
            // Obtener la URL pública usando Supabase Storage
            const { data: urlData } = supabase.storage
              .from('course-videos')
              .getPublicUrl(filePath);
            
            if (urlData?.publicUrl) {
              url = urlData.publicUrl;
            } else {
              // Fallback: usar NEXT_PUBLIC_SUPABASE_URL directamente
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
              if (supabaseUrl) {
                url = `${supabaseUrl}/storage/v1/object/public/course-videos/${filePath}`;
              }
            }
          } catch (error) {
            // Fallback: usar NEXT_PUBLIC_SUPABASE_URL directamente
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            if (supabaseUrl) {
              let filePath = url;
              if (!filePath.includes('/')) {
                filePath = `videos/${filePath}`;
              }
              url = `${supabaseUrl}/storage/v1/object/public/course-videos/${filePath}`;
            }
          }
        }
        break;
      default:
        url = '';
    }
    
    return url;
  };

  // Manejar carga del iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Manejar errores del iframe
  const handleIframeError = () => {
    // console.error('VideoPlayer iframe error');
    setIsLoading(false);
    setError('Error al cargar el video');
  };

  // Renderizar contenido según el proveedor
  const renderVideoContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{error}</p>
            <p className="text-sm text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
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

    // Para videos directos o custom, usar CustomVideoPlayer con controles personalizados
    if (videoProvider === 'direct' || videoProvider === 'custom') {
      return (
        <CustomVideoPlayer
          src={videoUrl}
          title={title}
          className="w-full h-full"
          onProgress={onProgress}
          onComplete={onComplete}
        />
      );
    }

    // Para YouTube y Vimeo, usar iframe
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419] dark:bg-[#0F1419] rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4B3]" />
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
