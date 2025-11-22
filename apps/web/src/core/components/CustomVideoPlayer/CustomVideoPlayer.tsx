'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  PictureInPicture,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function CustomVideoPlayer({
  src,
  title,
  className = '',
  onProgress,
  onComplete
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Ocultar controles automáticamente después de 3 segundos
  useEffect(() => {
    if (!isHovering && isPlaying && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHovering, isPlaying, showControls]);

  // Mostrar controles al hacer hover
  useEffect(() => {
    if (isHovering) {
      setShowControls(true);
    }
  }, [isHovering]);

  // Actualizar tiempo actual
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (onProgress && duration > 0) {
        onProgress((video.currentTime / duration) * 100);
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', () => setIsBuffering(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', () => setIsBuffering(false));
    };
  }, [duration, onProgress, onComplete]);

  // Manejar fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  // Función para actualizar el progreso del video
  const updateProgress = (clientX: number) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // Función para actualizar el volumen
  const updateVolume = (clientY: number) => {
    const video = videoRef.current;
    const volumeBar = volumeBarRef.current;
    if (!video || !volumeBar) return;

    const rect = volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    const newVolume = Math.max(0, Math.min(1, percent));
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handlers para la barra de progreso
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    updateProgress(e.clientX);
    setShowControls(true);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingProgress) {
      e.preventDefault();
      updateProgress(e.clientX);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
  };

  // Handlers para la barra de volumen
  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    updateVolume(e.clientY);
    setShowVolumeControl(true);
  };

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      e.preventDefault();
      updateVolume(e.clientY);
    }
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
  };

  // Handlers para touch events (móviles)
  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    const touch = e.touches[0];
    if (touch) updateProgress(touch.clientX);
    setShowControls(true);
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingProgress) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updateProgress(touch.clientX);
    }
  };

  const handleProgressTouchEnd = () => {
    setIsDraggingProgress(false);
  };

  const handleVolumeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    const touch = e.touches[0];
    if (touch) updateVolume(touch.clientY);
    setShowVolumeControl(true);
  };

  const handleVolumeTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updateVolume(touch.clientY);
    }
  };

  const handleVolumeTouchEnd = () => {
    setIsDraggingVolume(false);
  };

  // Handlers globales para mouse move y up (para arrastrar fuera del elemento)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) {
        e.preventDefault();
        updateProgress(e.clientX);
      }
      if (isDraggingVolume) {
        e.preventDefault();
        updateVolume(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume]);

  // Handlers para click (fallback si no se está arrastrando)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingProgress) {
      updateProgress(e.clientX);
      setShowControls(true);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingVolume) {
      updateVolume(e.clientY);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setShowControls(true);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
      setShowSettings(false);
      setShowControls(true);
    } catch (error) {
      console.error('Error con Picture-in-Picture:', error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    setShowControls(true);
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-40 pointer-events-none"
          >
            {/* Top Controls - Botones de navegación rápida */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => skip(-10)}
                className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
                title="Retroceder 10s"
              >
                <ChevronLeft className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
              <button
                onClick={() => skip(10)}
                className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
                title="Avanzar 10s"
              >
                <ChevronRight className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto group"
              >
                <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
              </motion.button>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Progress Bar */}
              <div
                ref={progressBarRef}
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                onMouseMove={handleProgressMouseMove}
                onMouseUp={handleProgressMouseUp}
                onMouseLeave={handleProgressMouseUp}
                onTouchStart={handleProgressTouchStart}
                onTouchMove={handleProgressTouchMove}
                onTouchEnd={handleProgressTouchEnd}
                className={`w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/progress hover:h-2 transition-all duration-200 ${
                  isDraggingProgress ? 'h-2' : ''
                }`}
                style={{ userSelect: 'none' }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  initial={false}
                >
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-opacity shadow-lg ${
                    isDraggingProgress || isHovering ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100'
                  }`} />
                </motion.div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Play className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* Volume Control */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowVolumeControl(true)}
                    onMouseLeave={() => setShowVolumeControl(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      title={isMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    {/* Volume Slider */}
                    <AnimatePresence>
                      {showVolumeControl && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-md rounded-lg"
                        >
                          <div
                            ref={volumeBarRef}
                            onClick={handleVolumeClick}
                            onMouseDown={handleVolumeMouseDown}
                            onMouseMove={handleVolumeMouseMove}
                            onMouseUp={handleVolumeMouseUp}
                            onMouseLeave={handleVolumeMouseUp}
                            onTouchStart={handleVolumeTouchStart}
                            onTouchMove={handleVolumeTouchMove}
                            onTouchEnd={handleVolumeTouchEnd}
                            className="w-2 h-20 bg-white/20 rounded-full cursor-pointer relative"
                            style={{ userSelect: 'none' }}
                          >
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                              style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                              initial={false}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time Display */}
                  <div className="text-white text-sm font-medium tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      title="Configuración"
                    >
                      <Settings className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Settings Dropdown */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden"
                        >
                          {/* Velocidad de reproducción */}
                          <div className="p-2 border-b border-white/10">
                            <div className="px-3 py-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                              Velocidad de reproducción
                            </div>
                            <div className="space-y-1">
                              {playbackRates.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                                    playbackRate === rate
                                      ? 'bg-blue-500/20 text-blue-400 font-medium'
                                      : 'text-white/80 hover:bg-white/10'
                                  }`}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Imagen en imagen */}
                          <button
                            onClick={togglePictureInPicture}
                            className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
                          >
                            <PictureInPicture className="w-4 h-4" />
                            Imagen en imagen
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Maximize className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

