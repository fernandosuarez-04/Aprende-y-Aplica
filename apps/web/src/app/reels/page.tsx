'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Grid3X3,
  List,
  User,
  Eye,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { CommentsPanel } from '../../features/reels/components';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter } from 'next/navigation';

interface Reel {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  category: string;
  language: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  created_at: string;
  users: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Función para formatear números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Función para formatear duración
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para manejar likes
  const handleLike = useCallback(async (reelId: string) => {
    try {
      console.log(`🔄 Toggling like for reel: ${reelId}`); // Debug
      
      // Prevenir múltiples clicks simultáneos
      const currentLikedState = likedReels.has(reelId);
      console.log(`🔍 Current liked state for ${reelId}:`, currentLikedState); // Debug
      
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to toggle like:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      const isLiked = result.liked;

      console.log(`✅ Like ${isLiked ? 'added' : 'removed'} for reel ${reelId}`); // Debug
      
      setLikedReels(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(reelId);
        } else {
          newSet.delete(reelId);
        }
        console.log(`🔍 Updated liked reels:`, Array.from(newSet)); // Debug
        return newSet;
      });

      // Actualizar el conteo local
      setReels(prev => prev.map(reel => 
        reel.id === reelId 
          ? { 
              ...reel, 
              like_count: isLiked 
                ? reel.like_count + 1 
                : Math.max(reel.like_count - 1, 0)
            }
          : reel
      ));
      
    } catch (error) {
      console.error('❌ Error liking reel:', error);
    }
  }, [likedReels]);

  // Cargar reels
  const loadReels = async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reels?page=${pageNum}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        
        // Manejar diferentes estructuras de respuesta
        let reelsData = [];
        if (Array.isArray(result)) {
          reelsData = result;
        } else if (result.data && Array.isArray(result.data)) {
          reelsData = result.data;
        } else if (result.reels && Array.isArray(result.reels)) {
          reelsData = result.reels;
        } else {
          console.error('Unexpected API response structure:', result);
          reelsData = [];
        }
        
        console.log('📊 Reels loaded:', { 
          count: reelsData.length, 
          sample: reelsData[0] ? {
            id: reelsData[0].id,
            title: reelsData[0].title,
            hasUsers: !!reelsData[0].users,
            usersData: reelsData[0].users
          } : null
        });
        
        if (pageNum === 1) {
          setReels(reelsData);
        } else {
          setReels(prev => [...prev, ...reelsData]);
        }
        setHasMore(reelsData.length === 10);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar likes del usuario
  const loadUserLikes = useCallback(async () => {
    try {
      setIsLoadingLikes(true);
      console.log('🔄 Loading user likes...'); // Debug
      const response = await fetch('/api/reels/likes');
      
      if (!response.ok) {
        console.error('❌ Failed to load user likes:', response.status, response.statusText);
        return;
      }
      
      const likedIds = await response.json();
      
      // Validar que la respuesta es un array
      if (!Array.isArray(likedIds)) {
        console.error('❌ Invalid response format from likes API:', likedIds);
        return;
      }
      
      console.log('✅ Loaded liked reel IDs:', likedIds); // Debug
      setLikedReels(new Set(likedIds));
      
      // Verificar que los likes se aplicaron correctamente
      setTimeout(() => {
        console.log('🔍 Current liked reels state:', Array.from(new Set(likedIds))); // Debug
      }, 100);
      
    } catch (error) {
      console.error('❌ Error loading user likes:', error);
    } finally {
      setIsLoadingLikes(false);
    }
  }, []);

  // Registrar vista del video
  const registerView = async (reelId: string) => {
    try {
      await fetch(`/api/reels/${reelId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error registering view:', error);
    }
  };

  // Función para actualizar contador de comentarios
  const handleCommentAdded = () => {
    if (reels && Array.isArray(reels) && reels[currentReelIndex]) {
      setReels(prev => prev.map(reel =>
        reel.id === reels[currentReelIndex].id
          ? { ...reel, comment_count: reel.comment_count + 1 }
          : reel
      ));
    }
  };

  const playVideo = (index: number) => {
    // Pausar todos los videos
    videoRefs.current.forEach((video) => {
      if (video) {
        try {
        video.pause();
        } catch (error) {
          console.warn('Error pausing video:', error);
        }
      }
    });

    // Reproducir el video actual
    const currentVideo = videoRefs.current[index];
    if (currentVideo) {
      try {
        currentVideo.play().catch((error) => {
          console.warn('Error playing video:', error);
        });
      setIsPlaying(true);
      
      // Registrar vista del video
      if (reels && Array.isArray(reels) && reels[index]) {
        registerView(reels[index].id);
      }
      } catch (error) {
        console.warn('Error with video play:', error);
      }
    }
  };

  const pauseVideo = () => {
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      try {
      currentVideo.pause();
      setIsPlaying(false);
      } catch (error) {
        console.warn('Error pausing video:', error);
      }
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo(currentReelIndex);
    }
  };

  const toggleMute = () => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = !isMuted;
      }
    });
    setIsMuted(!isMuted);
  };

  // Sincronizar estado de likes con reels cargados
  useEffect(() => {
    if (reels.length > 0 && !isLoadingLikes) {
      console.log('🔍 Syncing likes state with loaded reels');
      console.log('📊 Reels loaded:', reels.length);
      console.log('❤️ Liked reels:', Array.from(likedReels));
      
      // Verificar que cada reel tiene el estado correcto
      reels.forEach(reel => {
        const isLiked = likedReels.has(reel.id);
        console.log(`🎬 Reel "${reel.title}" (${reel.id}): liked=${isLiked}, count=${reel.like_count}`);
      });
    }
  }, [reels, likedReels, isLoadingLikes]);

  // Efectos
  useEffect(() => {
    const initializeData = async () => {
      await loadReels();
      await loadUserLikes();
    };
    
    initializeData();
    
    // Detectar si es móvil
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (reels && Array.isArray(reels) && reels.length > 0) {
      playVideo(currentReelIndex);
    }
  }, [currentReelIndex, reels]);

  // Manejo de scroll para cambiar videos
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (viewMode === 'feed' && reels && Array.isArray(reels)) {
        if (e.deltaY > 0 && currentReelIndex < reels.length - 1) {
          setCurrentReelIndex(prev => prev + 1);
        } else if (e.deltaY < 0 && currentReelIndex > 0) {
          setCurrentReelIndex(prev => prev - 1);
        }
      }
    };

    if (viewMode === 'feed') {
      window.addEventListener('wheel', handleScroll, { passive: false });
      return () => window.removeEventListener('wheel', handleScroll);
    }
  }, [currentReelIndex, reels, viewMode]);

  if (isLoading && (!reels || reels.length === 0)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando reels...</div>
      </div>
    );
  }

  if (!reels || !Array.isArray(reels) || reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No hay reels disponibles</h1>
            <Button
              onClick={() => router.push('/news')}
              className="bg-white/10 hover:bg-white/20 text-white border-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Noticias
            </Button>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-16">
        {/* Header */}
          <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/news')}
                className="bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <h1 className="text-xl font-bold text-white">Reels</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('feed')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 bg-white/20 rounded-lg text-white"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {reels && Array.isArray(reels) && reels.map((reel, index) => (
              <motion.div
                key={reel.id}
                className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                  setViewMode('feed');
                  setCurrentReelIndex(index);
                }}
              >
                <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                  src={reel.video_url}
                  poster={reel.thumbnail_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {reel.title}
                  </h3>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(reel.view_count)}</span>
                    <Heart className="w-3 h-3" />
                    <span>{formatNumber(reel.like_count)}</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 rounded-full px-2 py-1">
                    <span className="text-white text-xs">
                      {reel.duration_seconds ? formatDuration(reel.duration_seconds) : '0:00'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <Button
                  onClick={() => {
                    setPage(prev => prev + 1);
                    loadReels(page + 1);
                  }}
                className="bg-white/10 hover:bg-white/20 text-white border-none"
              >
                Cargar más
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-black ${isMobile ? 'relative' : 'flex'}`}>
      {/* Botón Volver minimalista */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => router.push('/news')}
          className="w-10 h-10 bg-black/30 backdrop-blur-sm hover:bg-black/50 rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Video principal - Layout diferente para móvil y desktop */}
      <div className={`${isMobile ? 'absolute inset-0' : 'flex-1 flex items-center justify-center relative'}`}>
        {reels && Array.isArray(reels) && reels.map((reel, index) => (
          <motion.div
            key={reel.id}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: index === currentReelIndex ? 1 : 0,
              scale: index === currentReelIndex ? 1 : 0.95
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Video Container - Pantalla completa en móvil, responsive en desktop */}
            <div 
              className="relative bg-black overflow-hidden cursor-pointer"
              style={{
                // Móvil: Video pantalla completa
                width: isMobile 
                  ? '100vw' 
                  : 'min(100vw - 200px, 100vh * 9/16)',
                height: isMobile 
                  ? '100vh' 
                  : 'min(100vh - 100px, (100vw - 200px) * 16/9)',
                maxWidth: isMobile ? '100vw' : '500px',
                maxHeight: isMobile ? '100vh' : '90vh'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlayPause();
              }}
            >
            <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
              src={reel.video_url}
              poster={reel.thumbnail_url}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
              onEnded={() => {
                if (index < reels.length - 1) {
                  setCurrentReelIndex(index + 1);
                }
              }}
            />

              {/* Overlay de controles */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Botón de play/pause centrado - Solo cuando está pausado */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" />
                  </button>
                </div>
              )}

              {/* Botón de mute en esquina */}
              <div className="absolute top-4 right-4">
                  <button
                    onClick={toggleMute}
                  className="w-10 h-10 md:w-12 md:h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/90 transition-all border border-white/20"
                  >
                    {isMuted ? (
                    <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : (
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    )}
                  </button>
              </div>

              {/* Botones de interacción sobrepuestos - Solo en móvil */}
              {isMobile && reels && Array.isArray(reels) && reels[currentReelIndex] && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 z-40">
                  {/* Perfil del usuario */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      {reels[currentReelIndex].users.profile_picture_url ? (
                        <img
                          src={reels[currentReelIndex].users.profile_picture_url}
                          alt={reels[currentReelIndex].users.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Like */}
                  <div className="flex flex-col items-center space-y-1">
                      <button
                      onClick={() => handleLike(reels[currentReelIndex].id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        likedReels.has(reels[currentReelIndex].id) 
                          ? 'bg-red-500' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${
                        likedReels.has(reels[currentReelIndex].id) ? 'fill-current text-white' : 'text-white'
                      }`} />
                      </button>
                    <span className="text-white text-xs font-semibold">
                      {formatNumber(reels[currentReelIndex].like_count)}
                      </span>
                    </div>

                  {/* Comentarios */}
                  <div className="flex flex-col items-center space-y-1">
                      <button
                      onClick={() => setIsCommentsOpen(true)}
                      className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                      >
                        <MessageCircle className="w-6 h-6 text-white" />
                      </button>
                    <span className="text-white text-xs font-semibold">
                      {formatNumber(reels[currentReelIndex].comment_count)}
                      </span>
                    </div>

                  {/* Compartir */}
                  <div className="flex flex-col items-center space-y-1">
                    <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                        <Share2 className="w-6 h-6 text-white" />
                      </button>
                    <span className="text-white text-xs font-semibold">
                      {formatNumber(reels[currentReelIndex].share_count)}
                      </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Panel lateral derecho - Interacciones - Solo en desktop */}
      {!isMobile && (
        <div className="w-16 lg:w-20 pr-4 flex flex-col items-center justify-center space-y-6">
        {/* Botones de navegación */}
        <div className={`flex flex-col ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
          <button
            onClick={() => currentReelIndex > 0 && setCurrentReelIndex(currentReelIndex - 1)}
            disabled={currentReelIndex === 0}
            className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-50`}
          >
            <ChevronUpIcon className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
          </button>
                <button
            onClick={() => currentReelIndex < reels.length - 1 && setCurrentReelIndex(currentReelIndex + 1)}
            disabled={currentReelIndex === reels.length - 1}
            className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-50`}
                >
            <ChevronDownIcon className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                </button>
              </div>

        {/* Botones de interacción */}
        {reels && Array.isArray(reels) && reels[currentReelIndex] && (
          <>
            {/* Perfil del usuario */}
            <div className="flex flex-col items-center space-y-1">
              <div className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center`}>
                {reels[currentReelIndex].users?.profile_picture_url ? (
                  <img
                    src={reels[currentReelIndex].users.profile_picture_url}
                    alt={reels[currentReelIndex].users.username || 'Usuario'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                )}
              </div>
              <span className="text-white text-xs font-semibold">
                {reels[currentReelIndex].users?.username || 'Usuario'}
              </span>
            </div>

            {/* Like */}
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleLike(reels[currentReelIndex].id)}
                className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all ${
                  likedReels.has(reels[currentReelIndex].id) 
                    ? 'bg-red-500' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Heart className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} ${
                  likedReels.has(reels[currentReelIndex].id) ? 'fill-current text-white' : 'text-white'
                }`} />
              </button>
              <span className="text-white text-xs font-semibold">
                {formatNumber(reels[currentReelIndex].like_count)}
              </span>
            </div>

            {/* Comentarios */}
            <div className="flex flex-col items-center space-y-1">
              <button 
                onClick={() => setIsCommentsOpen(true)}
                className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all`}
              >
                <MessageCircle className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
              </button>
              <span className="text-white text-xs font-semibold">
                {formatNumber(reels[currentReelIndex].comment_count)}
                        </span>
            </div>

            {/* Compartir */}
            <div className="flex flex-col items-center space-y-1">
              <button className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all`}>
                <Share2 className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
              </button>
              <span className="text-white text-xs font-semibold">
                {formatNumber(reels[currentReelIndex].share_count)}
                        </span>
                      </div>
          </>
        )}
        </div>
      )}

      {/* Información del video superpuesta */}
      {reels && Array.isArray(reels) && reels[currentReelIndex] && (
        <div className={`fixed bottom-4 left-4 ${isMobile ? 'right-4' : 'right-20 lg:right-24'} z-30`}>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-md">
            {/* Información del usuario */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {reels[currentReelIndex].users.profile_picture_url ? (
                  <img
                    src={reels[currentReelIndex].users.profile_picture_url}
                    alt={reels[currentReelIndex].users.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {reels[currentReelIndex].users.username}
                </p>
                <p className="text-white/70 text-xs">
                  Hace unos minutos
                </p>
                    </div>
                  </div>

            {/* Información del video */}
            <div className="space-y-2">
              <h2 className="text-white font-bold text-base line-clamp-2">
                {reels[currentReelIndex].title}
              </h2>
              <p className="text-white/80 text-sm line-clamp-2">
                {reels[currentReelIndex].description}
              </p>
            </div>

          </div>
              </div>
      )}

      {/* Panel de Comentarios */}
      {reels && Array.isArray(reels) && reels[currentReelIndex] && (
        <CommentsPanel
          reelId={reels[currentReelIndex].id}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          commentCount={reels[currentReelIndex].comment_count}
          isMobile={isMobile}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}