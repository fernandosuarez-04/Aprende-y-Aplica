'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  User,
  Calendar,
  Eye,
  ThumbsUp,
  Share,
  Bookmark,
  Flag,
  ChevronDown,
  ChevronUp,
  Hash,
  TrendingUp,
  Star,
  Clock,
  Globe
} from 'lucide-react';
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
  created_by: string;
  created_at: string;
  published_at?: string;
  hashtags: string[];
  users: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
}

interface ReelComment {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchReels();
  }, [selectedCategory, page]);

  useEffect(() => {
    setupIntersectionObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [reels]);

  const setupIntersectionObserver = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentReelIndex(index);
            playVideo(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((video, index) => {
      if (video && observerRef.current) {
        observerRef.current.observe(video);
      }
    });
  };

  const fetchReels = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        language: 'es'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/reels?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (page === 1) {
          setReels(data.reels);
        } else {
          setReels(prev => [...prev, ...data.reels]);
        }
        
        setHasMore(data.pagination.hasMore);
        
        // Cargar likes del usuario
        await loadUserLikes();
      } else {
        console.error('Error fetching reels:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLikes = async () => {
    try {
      const likedSet = new Set<string>();
      
      for (const reel of reels) {
        const response = await fetch(`/api/reels/${reel.id}/like`);
        if (response.ok) {
          const data = await response.json();
          if (data.liked) {
            likedSet.add(reel.id);
          }
        }
      }
      
      setLikedReels(likedSet);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const playVideo = (index: number) => {
    // Pausar todos los videos
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
      }
    });

    // Reproducir el video actual
    const currentVideo = videoRefs.current[index];
    if (currentVideo) {
      currentVideo.play();
      setIsPlaying(true);
    }
  };

  const pauseVideo = () => {
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      currentVideo.pause();
      setIsPlaying(false);
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

  const handleLike = async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        setLikedReels(prev => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(reelId);
          } else {
            newSet.delete(reelId);
          }
          return newSet;
        });

        // Actualizar contador local
        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, like_count: data.liked ? reel.like_count + 1 : reel.like_count - 1 }
            : reel
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleReelClick = (reelId: string) => {
    loadComments(reelId);
    setShowComments(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('es-ES');
  };

  if (isLoading && reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando reels...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
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

        {/* Empty State */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-white/50" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No hay reels disponibles</h2>
            <p className="text-white/70 mb-6 max-w-md">
              Los reels aparecerán aquí una vez que se suban videos a la plataforma.
            </p>
            <Button
              onClick={() => router.push('/news')}
              className="bg-white/10 hover:bg-white/20 text-white border-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Noticias
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
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
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reels.map((reel, index) => (
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
                  ref={(el) => (videoRefs.current[index] = el)}
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
                onClick={() => setPage(prev => prev + 1)}
                className="bg-white/10 hover:bg-white/20 text-white border-none"
              >
                Cargar más
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Feed View */}
      <div className="h-screen overflow-hidden">
        {reels.map((reel, index) => (
          <motion.div
            key={reel.id}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: index === currentReelIndex ? 1 : 0,
              scale: index === currentReelIndex ? 1 : 0.95
            }}
            transition={{ duration: 0.3 }}
            data-index={index}
          >
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
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

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex">
              {/* Left Side - Video Controls */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side - Info and Actions */}
              <div className="w-80 p-6 flex flex-col justify-between">
                {/* Top Actions */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => router.push('/news')}
                    className="bg-white/10 hover:bg-white/20 text-white border-none"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </div>

                {/* Bottom Content */}
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      {reel.users.profile_picture_url ? (
                        <img
                          src={reel.users.profile_picture_url}
                          alt={reel.users.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">
                        {reel.users.first_name && reel.users.last_name
                          ? `${reel.users.first_name} ${reel.users.last_name}`
                          : reel.users.username
                        }
                      </h4>
                      <p className="text-white/70 text-sm">
                        {formatDate(reel.published_at || reel.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                      {reel.title}
                    </h3>
                    {reel.description && (
                      <p className="text-white/80 text-sm line-clamp-3">
                        {reel.description}
                      </p>
                    )}
                  </div>

                  {/* Hashtags */}
                  {reel.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {reel.hashtags.map((hashtag, idx) => (
                        <span
                          key={idx}
                          className="text-blue-400 text-sm font-medium"
                        >
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleLike(reel.id)}
                        className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                      >
                        <Heart 
                          className={`w-6 h-6 ${
                            likedReels.has(reel.id) 
                              ? 'text-red-500 fill-red-500' 
                              : 'text-white'
                          }`} 
                        />
                      </button>
                      <span className="text-white text-xs font-medium">
                        {formatNumber(reel.like_count)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleReelClick(reel.id)}
                        className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                      >
                        <MessageCircle className="w-6 h-6 text-white" />
                      </button>
                      <span className="text-white text-xs font-medium">
                        {formatNumber(reel.comment_count)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                        <Share2 className="w-6 h-6 text-white" />
                      </button>
                      <span className="text-white text-xs font-medium">
                        {formatNumber(reel.share_count)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                        <MoreHorizontal className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComments(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-sm border-l border-white/10 p-6"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Comentarios</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-white/70 hover:text-white"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {comment.users.profile_picture_url ? (
                        <img
                          src={comment.users.profile_picture_url}
                          alt={comment.users.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">
                          {comment.users.first_name && comment.users.last_name
                            ? `${comment.users.first_name} ${comment.users.last_name}`
                            : comment.users.username
                          }
                        </span>
                        <span className="text-white/50 text-xs">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
