'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Interfaz para el contexto del VideoPlayer
interface VideoPlayerContextType {
  isVideoPlaying: boolean;
  isPiPActive: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
  setIsPiPActive: (active: boolean) => void;
  requestPiP: () => Promise<void>;
  exitPiP: () => Promise<void>;
}

// Crear el contexto
const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

// Provider del contexto
export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Función para activar PiP - busca el elemento video en el DOM
  const requestPiP = useCallback(async () => {
    // Si ya está en PiP, no hacer nada
    if (isPiPActive || document.pictureInPictureElement) {
      return;
    }

    try {
      // Buscar el elemento video en el DOM
      const videoElement = document.querySelector('video');
      if (videoElement && !videoElement.paused) {
        await videoElement.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
      console.log('No se pudo activar Picture-in-Picture:', error);
    }
  }, [isPiPActive]);

  // Función para salir de PiP
  const exitPiP = useCallback(async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } catch (error) {
        console.log('No se pudo desactivar Picture-in-Picture:', error);
      }
    }
  }, []);

  return (
    <VideoPlayerContext.Provider
      value={{
        isVideoPlaying,
        isPiPActive,
        setIsVideoPlaying,
        setIsPiPActive,
        requestPiP,
        exitPiP,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

// Hook para usar el contexto
export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}

// Hook opcional que no lanza error si no está en el provider
export function useVideoPlayerOptional() {
  return useContext(VideoPlayerContext);
}
