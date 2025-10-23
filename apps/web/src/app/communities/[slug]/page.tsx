'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Search,
  Users,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Plus,
  Image,
  FileText,
  Link,
  Play,
  BarChart3,
  Send,
  Clock,
  CheckCircle,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  File,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
  Zap,
  Copy,
  Twitter,
  Facebook,
  ExternalLink,
  Download,
  X,
  Image as ImageIcon,
  Link2,
  Globe
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter, useParams } from 'next/navigation';
// Importaciones usando rutas relativas
import { ReactionButton } from '../../../features/communities/components/ReactionButton';
import { CommentsSection } from '../../../features/communities/components/CommentsSection';
// import { ShareButton } from '../../../../features/communities/components/ShareButton';
// import { AttachmentViewer } from '../../../../features/communities/components/AttachmentViewer';
// import { useAuth } from '@/features/auth/hooks/useAuth';

// Componentes completos para la comunidad
// ReactionButton component is now imported from features/communities/components

function LocalCommentsSection({ postId, communitySlug, onCommentAdded, showComments, setShowComments }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, postId, communitySlug]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        onCommentAdded?.(data.comment);
      } else {
        const errorData = await response.json();
        console.error('Error creating comment:', errorData.error);
        alert('Error al crear el comentario: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Error al crear el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'Enviando...' : 'Comentar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.first_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {comment.user?.first_name && comment.user?.last_name 
                            ? `${comment.user.first_name} ${comment.user.last_name}`
                            : comment.user?.username || 'Usuario'
                          }
                        </span>
                        <span className="text-slate-400 text-sm">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-200">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareButton({ postId, postContent, communityName, communitySlug }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const postUrl = `${window.location.origin}/communities/${communitySlug}#post-${postId}`;
  const shareText = `Mira este post de ${communityName}: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="relative" ref={buttonRef}>
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 className="w-5 h-5" />
        <span>Compartir</span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-600 rounded-2xl p-3 shadow-2xl backdrop-blur-sm z-50 min-w-[200px]"
          >
            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(postUrl)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200 text-sm">Copiar enlace</span>
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200 text-sm">Compartir en Twitter</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                <span className="text-slate-200 text-sm">Compartir en Facebook</span>
              </button>
            </div>

            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-2 pt-2 border-t border-slate-600"
                >
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Copy className="w-3 h-3" />
                    ¡Enlace copiado!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para renderizar encuestas
function PollViewer({ pollData, postId }: { pollData: any; postId: string }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPollData, setCurrentPollData] = useState(pollData);

  console.log('🎯 PollViewer received data:', pollData);
  console.log('🎯 PollViewer - Raw pollData keys:', Object.keys(pollData || {}));

  // Normalizar los datos de la encuesta
  const normalizedData = {
    question: currentPollData.question || currentPollData.title || 'Encuesta',
    options: currentPollData.options || currentPollData.choices || currentPollData.responses || []
  };
  
  console.log('🎯 PollViewer - Normalized data:', normalizedData);

  // Calcular votos totales usando la estructura del sistema anterior
  const totalVotes = normalizedData.options?.reduce((sum: number, option: any) => {
    const optionKey = option.text || option.option || option;
    const votes = currentPollData.votes?.[optionKey] || currentPollData.votes?.[option] || 0;
    return sum + (Array.isArray(votes) ? votes.length : votes);
  }, 0) || 0;

  // Obtener el voto actual del usuario al cargar
  useEffect(() => {
    const getUserVote = async () => {
      try {
        const response = await fetch(`/api/communities/ecos-de-liderazgo/polls/${postId}/vote`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.userVote) {
            setSelectedOption(data.userVote);
            setHasVoted(true);
          }
        }
      } catch (error) {
        console.error('Error obteniendo voto del usuario:', error);
      }
    };

    getUserVote();
  }, [postId]);

  const handleVote = async (optionKey: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const action = hasVoted && selectedOption === optionKey ? 'remove' : 'vote';
      
      const response = await fetch(`/api/communities/ecos-de-liderazgo/polls/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option: optionKey,
          action: action
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Actualizar los datos de la encuesta
          setCurrentPollData(data.pollData);
          
          if (action === 'vote') {
            setSelectedOption(optionKey);
            setHasVoted(true);
          } else {
            setSelectedOption(null);
            setHasVoted(false);
          }
          
          console.log('✅ Voto procesado:', data.message);
        }
      } else {
        const errorData = await response.json();
        console.error('Error en votación:', errorData.error);
        // Aquí podrías mostrar un toast de error
      }
    } catch (error) {
      console.error('Error enviando voto:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 border border-slate-700/40 backdrop-blur-xl shadow-2xl mb-6"
    >
      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
      
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 border-b border-slate-700/30">
        <div className="flex items-center gap-4 p-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-xl mb-1">
              {normalizedData.question}
            </h4>
            <p className="text-slate-400 text-sm">Selecciona tu respuesta</p>
          </div>
        </div>
      </div>

      {/* Opciones de la encuesta */}
      <div className="p-6 space-y-4">
        {normalizedData.options?.map((option: any, index: number) => {
          const optionKey = option.text || option.option || option;
          const votes = currentPollData.votes?.[optionKey] || currentPollData.votes?.[option] || 0;
          const voteCount = Array.isArray(votes) ? votes.length : votes;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOption === optionKey;
          
          return (
            <motion.div
              key={option.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${
                isSelected 
                  ? 'border-blue-400 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-indigo-500/20 shadow-lg shadow-blue-500/30 scale-[1.02]' 
                  : 'border-slate-600/50 bg-slate-800/40 hover:border-blue-400/60 hover:bg-slate-700/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/20'
              }`}
              onClick={() => !isLoading && handleVote(optionKey)}
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                    <span className="text-white font-semibold text-lg">
                      {optionKey}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-blue-400 font-bold text-lg">
                      {percentage}%
                    </div>
                    <div className="text-slate-400 text-sm">
                      {voteCount} votos
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso mejorada */}
                {hasVoted && (
                  <div className="relative">
                    <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                      >
                        {/* Efecto de brillo en la barra */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer mejorado */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-t border-slate-700/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-slate-300 font-medium">
              {totalVotes} votos totales
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-600/30">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Procesando voto...</span>
            </div>
          ) : hasVoted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-600/30"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Haz click en tu voto para quitarlo o en otra opción para cambiar</span>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function AttachmentViewer({ attachmentUrl, attachmentType, attachmentData, fileName, postId }: any) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Debug: ver qué datos llegan
  console.log('🔍 AttachmentViewer props:', { 
    attachmentUrl, 
    attachmentType, 
    attachmentData, 
    fileName,
    isPoll: attachmentType === 'poll',
    hasAttachmentData: !!attachmentData
  });
  
  // Debug más detallado para encuestas
  if (attachmentType === 'poll') {
    console.log('🎯 POLL DETECTED - Full data:', {
      attachmentType,
      attachmentData,
      attachmentUrl,
      fileName
    });
  }

  // Si es una encuesta, renderizar el componente de encuesta
  // Verificar diferentes tipos de encuestas
  const isPoll = attachmentType === 'poll' || 
                 attachmentType === 'encuesta' || 
                 attachmentType === 'survey' ||
                 (attachmentData && (attachmentData.question || attachmentData.options));
  
  if (isPoll && attachmentData) {
    console.log('✅ Rendering PollViewer with data:', attachmentData);
    return <PollViewer pollData={attachmentData} postId={postId} />;
  }

  // Debug: si parece ser poll pero no tiene datos
  if (isPoll && !attachmentData) {
    console.log('❌ Poll type detected but no attachment data:', { attachmentType, attachmentData });
  }

  if (!attachmentUrl) return null;

  // Detectar si es una URL de YouTube
  const isYouTubeUrl = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return youtubeRegex.test(url);
  };

  // Detectar si es una imagen por URL
  const isImageUrl = (url: string) => {
    // URLs de Supabase Storage
    if (url.includes('supabase') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp'))) {
      return true;
    }
    
    // URLs base64 de imágenes
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // Extensiones de imagen
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    if (imageExtensions.test(url)) {
      return true;
    }
    
    // Dominios conocidos de imágenes
    const imageDomains = /\.(picsum\.photos|unsplash\.com|images\.unsplash\.com|via\.placeholder\.com)/i;
    return imageDomains.test(url);
  };

  // Detectar si es un video por URL
  const isVideoUrl = (url: string) => {
    // URLs de Supabase Storage
    if (url.includes('supabase') && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi'))) {
      return true;
    }
    
    // Extensiones de video
    const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv)(\?.*)?$/i;
    return videoExtensions.test(url);
  };

  // Función para extraer el nombre de la página desde la URL
  const getPageNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Mapeo de dominios conocidos a nombres más amigables
      const domainNames: { [key: string]: string } = {
        'claude.ai': 'Claude AI',
        'chatgpt.com': 'ChatGPT',
        'openai.com': 'OpenAI',
        'google.com': 'Google',
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'github.com': 'GitHub',
        'stackoverflow.com': 'Stack Overflow',
        'medium.com': 'Medium',
        'dev.to': 'Dev.to',
        'linkedin.com': 'LinkedIn',
        'twitter.com': 'Twitter',
        'x.com': 'X (Twitter)',
        'supabase.com': 'Supabase',
        'vercel.com': 'Vercel',
        'netlify.com': 'Netlify',
        'figma.com': 'Figma',
        'notion.so': 'Notion',
        'discord.com': 'Discord',
        'slack.com': 'Slack'
      };
      
      // Si es un dominio conocido, usar el nombre amigable
      if (domainNames[hostname]) {
        return domainNames[hostname];
      }
      
      // Si no, usar el hostname sin www
      return hostname.replace(/^www\./, '');
    } catch (error) {
      // Si hay error al parsear la URL, devolver la URL truncada
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  // Detectar si es un enlace externo (no archivo)
  const isExternalLink = (url: string) => {
    // URLs que claramente son enlaces externos
    const externalDomains = [
      'claude.ai',
      'chatgpt.com',
      'openai.com',
      'google.com',
      'youtube.com',
      'youtu.be',
      'github.com',
      'stackoverflow.com',
      'medium.com',
      'dev.to',
      'linkedin.com',
      'twitter.com',
      'x.com'
    ];
    
    // Si contiene un dominio externo conocido
    if (externalDomains.some(domain => url.includes(domain))) {
      return true;
    }
    
    // Si es una URL HTTP/HTTPS pero no tiene extensión de archivo
    if (url.startsWith('http') && !url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|zip|rar|7z|mp4|webm|mov|avi|jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i)) {
      return true;
    }
    
    return false;
  };

  // Detectar si es un documento/archivo
  const isDocumentFile = (url: string, type?: string) => {
    // Por tipo MIME
    if (type && (type.includes('document') || type.includes('pdf') || type.includes('application'))) {
      return true;
    }
    
    // Por extensión
    const documentExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|zip|rar|7z)(\?.*)?$/i;
    return documentExtensions.test(url);
  };

  // Extraer ID de video de YouTube
  const getYouTubeVideoId = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  // Si es una URL de YouTube, mostrar video embebido
  if (isYouTubeUrl(attachmentUrl)) {
    const videoId = getYouTubeVideoId(attachmentUrl);
    if (videoId) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4"
        >
        <div className="community-video-player">
          <div className="relative w-full" style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={fileName || 'Video de YouTube'}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </motion.div>
      );
    }
  }

  // Si es un video nativo (por tipo o por URL)
  if (attachmentType?.startsWith('video/') || attachmentType === 'video/youtube' || isVideoUrl(attachmentUrl)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4"
      >
        <div className="community-video-player">
          <video
            src={attachmentUrl}
            controls
            className="w-full h-auto max-h-[500px]"
            preload="metadata"
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      </motion.div>
    );
  }

  // Si es una imagen (por tipo o por URL)
  if (attachmentType?.startsWith('image/') || attachmentType === 'image/jpeg' || attachmentType === 'image/png' || attachmentType === 'image/gif' || isImageUrl(attachmentUrl)) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group cursor-pointer mb-4"
          onClick={() => setShowFullscreen(true)}
        >
          <div className="community-media-container">
            {!imageError ? (
              <img
                src={attachmentUrl}
                alt={fileName || 'Imagen adjunta'}
                className="w-full h-auto max-h-[600px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-slate-800 text-slate-400">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3" />
                  <p className="text-lg">Error al cargar la imagen</p>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setShowFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-[95vw] max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={attachmentUrl}
                  alt={fileName || 'Imagen adjunta'}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full p-3 text-white hover:bg-black/90 transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Si es un video (no YouTube)
  if (attachmentType?.startsWith('video/')) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group mb-4"
      >
        <div className="community-video-player">
          <video
            src={attachmentUrl}
            controls
            className="w-full h-auto max-h-[500px]"
            poster=""
          >
            Tu navegador no soporta el elemento de video.
          </video>
        </div>
      </motion.div>
    );
  }

  // Determinar el tipo de contenido
  const isLink = isExternalLink(attachmentUrl);
  const isDocument = isDocumentFile(attachmentUrl, attachmentType);
  
  // Para enlaces externos
  if (isLink) {
    const pageName = getPageNameFromUrl(attachmentUrl);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 mb-4 backdrop-blur-sm"
      >
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        <div className="relative p-6">
          <div className="flex items-start gap-5">
            {/* Icono mejorado */}
            <div className="relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <Link2 className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <h4 className="text-white font-semibold text-lg truncate">
                  {pageName}
                </h4>
              </div>
              
              <p className="text-blue-200/80 text-sm mb-3 font-medium">
                {fileName || 'Enlace web'}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-blue-400/70 bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-400/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="truncate">{attachmentUrl}</span>
              </div>
            </div>
            
            {/* Botones de acción mejorados */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open(attachmentUrl, '_blank')}
                className="group/btn p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Abrir enlace"
              >
                <ExternalLink className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-200" />
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(attachmentUrl);
                  // Aquí podrías agregar una notificación de "copiado"
                }}
                className="group/btn p-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Copiar enlace"
              >
                <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Para documentos/archivos
  if (isDocument) {
    // Función para extraer el nombre del archivo desde la URL si no se proporciona fileName
    const getDocumentName = () => {
      if (fileName) return fileName;
      
      try {
        const urlObj = new URL(attachmentUrl);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        
        if (filename && filename.includes('.')) {
          return filename;
        }
        
        // Si no hay nombre de archivo en la URL, usar el tipo de archivo
        if (attachmentType) {
          const extension = attachmentType.split('/').pop();
          return `documento.${extension}`;
        }
        
        return 'Documento adjunto';
      } catch (error) {
        return 'Documento adjunto';
      }
    };

    const documentName = getDocumentName();
    
    // Función para obtener el color del tipo de archivo
    const getFileTypeColor = (type?: string) => {
      if (!type) return 'from-slate-500 to-slate-600';
      if (type.includes('pdf')) return 'from-red-500 to-red-600';
      if (type.includes('doc') || type.includes('word')) return 'from-blue-500 to-blue-600';
      if (type.includes('xls') || type.includes('excel')) return 'from-green-500 to-green-600';
      if (type.includes('ppt') || type.includes('powerpoint')) return 'from-orange-500 to-orange-600';
      if (type.includes('txt')) return 'from-gray-500 to-gray-600';
      return 'from-slate-500 to-slate-600';
    };

    const fileTypeGradient = getFileTypeColor(attachmentType);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-500/10 via-gray-500/5 to-slate-500/10 border border-slate-400/20 hover:border-slate-400/40 transition-all duration-300 mb-4 backdrop-blur-sm"
      >
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        <div className="relative p-6">
          <div className="flex items-start gap-5">
            {/* Icono mejorado */}
            <div className="relative">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${fileTypeGradient} shadow-lg shadow-slate-500/25 group-hover:shadow-slate-500/40 transition-all duration-300 group-hover:scale-105`}>
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <File className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <h4 className="text-white font-semibold text-lg truncate">
                  {documentName}
                </h4>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-300/80 text-sm font-medium">
                  {attachmentType || 'Archivo adjunto'}
                </span>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span className="text-slate-400/70 text-xs">
                  Documento
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400/70 bg-slate-500/10 rounded-lg px-3 py-2 border border-slate-400/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Archivo adjunto disponible</span>
              </div>
            </div>
            
            {/* Botones de acción mejorados */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open(attachmentUrl, '_blank')}
                className="group/btn p-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white shadow-lg shadow-slate-600/25 hover:shadow-slate-600/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Abrir documento"
              >
                <ExternalLink className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-200" />
              </button>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = attachmentUrl;
                  link.download = fileName || documentName;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="group/btn p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Descargar"
              >
                <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Fallback para otros tipos
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 hover:bg-slate-700/50 transition-colors mb-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-slate-700/50 text-slate-400">
          <File className="w-8 h-8" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">
            {fileName || 'Archivo adjunto'}
          </h4>
          <p className="text-slate-400 text-sm">
            {attachmentType || 'Tipo desconocido'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            URL: {attachmentUrl.length > 50 ? attachmentUrl.substring(0, 50) + '...' : attachmentUrl}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => window.open(attachmentUrl, '_blank')}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = attachmentUrl;
              link.download = fileName || 'archivo';
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-2 rounded-lg bg-blue-600/50 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Hook local para evitar problemas de importación
function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: limpiar estado local y redirigir
      setUser(null);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
}

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url?: string;
  member_count: number;
  is_active: boolean;
  visibility: string;
  access_type: 'free' | 'invitation_only' | 'paid';
  created_at: string;
  updated_at: string;
  category?: string;
  is_member?: boolean;
  has_pending_request?: boolean;
  user_role?: string;
  can_join?: boolean;
}

interface Post {
  id: string;
  community_id: string;
  user_id: string;
  title?: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_data?: any; // Para datos de encuestas y otros adjuntos estructurados
  likes_count: number;
  comments_count: number;
  reaction_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_has_liked?: boolean;
  user_reaction_type?: string;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
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
  visible: { opacity: 1, y: 0 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  hover: { y: -2, scale: 1.01 }
};

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('comunidad');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postReactions, setPostReactions] = useState<Record<string, { type: string | null; count: number }>>({});
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (slug) {
      fetchCommunityDetail();
      fetchPosts();
    }
  }, [slug]);

  const fetchCommunityDetail = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data.community);
      } else {
        console.error('Error fetching community:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}/posts`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Posts data received:', data.posts);
        
        // Debug: buscar posts con encuestas
        const pollPosts = data.posts?.filter((post: any) => post.attachment_type === 'poll');
        console.log('🔍 Poll posts found:', pollPosts);
        
        setPosts(data.posts || []);
      } else {
        const errorData = await response.json();
        console.error('Error fetching posts:', errorData);
        
        // Si es error de autenticación, no mostrar posts pero permitir ver la comunidad
        if (response.status === 401 && errorData.requires_auth) {
          setPosts([]);
        } else if (response.status === 403 && errorData.requires_membership) {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !community) return;
    
    setIsCreatingPost(true);
    try {
      const response = await fetch(`/api/communities/${slug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          title: null,
          attachment_url: null,
          attachment_type: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Agregar el nuevo post al inicio de la lista
        setPosts(prev => [data.post, ...prev]);
        setNewPostContent('');
        // Actualizar contador de posts en la comunidad
        setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
      } else {
        const errorData = await response.json();
        console.error('Error creating post:', errorData.error);
        alert('Error al crear el post: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear el post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string | null) => {
    try {
      const response = await fetch(`/api/communities/${slug}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reaction_type: reactionType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el estado local de reacciones
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            type: data.reaction,
            count: data.action === 'added' 
              ? (prev[postId]?.count || 0) + 1
              : data.action === 'removed'
              ? Math.max((prev[postId]?.count || 0) - 1, 0)
              : (prev[postId]?.count || 0)
          }
        }));

        // Actualizar el post en la lista
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                reaction_count: data.action === 'added' 
                  ? post.reaction_count + 1
                  : data.action === 'removed'
                  ? Math.max(post.reaction_count - 1, 0)
                  : post.reaction_count
              }
            : post
        ));
      } else {
        const errorData = await response.json();
        console.error('Error handling reaction:', errorData.error);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!community) return;
    
    try {
      setIsJoining(true);
      
      if (community.access_type === 'free') {
        const response = await fetch('/api/communities/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ communityId: community.id }),
        });

        if (response.ok) {
          // Actualizar estado local
          setCommunity(prev => prev ? { ...prev, is_member: true, member_count: prev.member_count + 1 } : null);
          // Recargar posts para mostrar contenido completo
          fetchPosts();
        } else {
          const errorData = await response.json();
          console.error('Error joining community:', errorData.error);
        }
      } else {
        const response = await fetch('/api/communities/request-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ communityId: community.id }),
        });

        if (response.ok) {
          setCommunity(prev => prev ? { ...prev, has_pending_request: true } : null);
        } else {
          const errorData = await response.json();
          console.error('Error requesting access:', errorData.error);
        }
      }
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getCommunityStyle = (community: Community) => {
    if (community.slug === 'profesionales') {
      return {
        background: 'bg-gradient-to-br from-blue-900/40 to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        accent: 'text-blue-400',
        border: 'border-blue-500/30'
      };
    } else if (community.slug === 'ecos-liderazgo') {
      return {
        background: 'bg-gradient-to-br from-purple-900/40 to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-purple-600 to-purple-700',
        accent: 'text-orange-400',
        border: 'border-orange-500/30'
      };
    } else if (community.slug === 'openminder') {
      return {
        background: 'bg-gradient-to-br from-slate-900/50 to-black/60',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-900',
        accent: 'text-yellow-400',
        border: 'border-yellow-500/30'
      };
    }
    
    return {
      background: 'bg-gradient-to-br from-slate-800/50 to-slate-900/60',
      headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
      accent: 'text-slate-400',
      border: 'border-slate-600/30'
    };
  };

  const getAccessButton = () => {
    if (!community) return null;

    if (community.is_member) {
      return (
        <Button
          className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
          disabled
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Ya eres miembro
        </Button>
      );
    }

    if (community.has_pending_request) {
      return (
        <Button
          className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30"
          disabled
        >
          <Clock className="w-4 h-4 mr-2" />
          Solicitud pendiente
        </Button>
      );
    }

    if (community.access_type === 'free') {
      if (community.can_join === false) {
        return (
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-2">Ya perteneces a otra comunidad</div>
            <Button
              className="bg-slate-600/50 text-slate-400 border border-slate-600/50"
              disabled
            >
              <Lock className="w-4 h-4 mr-2" />
              Acceso Restringido
            </Button>
          </div>
        );
      }
      
      return (
        <Button
          onClick={handleJoinCommunity}
          disabled={isJoining}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isJoining ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2" />
          )}
          Unirse Gratis
        </Button>
      );
    }

    return (
      <Button
        onClick={handleJoinCommunity}
        disabled={isJoining}
        className="bg-purple-500 hover:bg-purple-600 text-white"
      >
        {isJoining ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Lock className="w-4 h-4 mr-2" />
        )}
        Solicitar Acceso
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Comunidad no encontrada</h1>
            <Button onClick={() => router.push('/communities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Comunidades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const communityStyle = getCommunityStyle(community);
  const canViewContent = community.is_member || (community.access_type === 'free' && community.can_join !== false);
  const needsAuth = !community.is_member && community.access_type === 'invitation_only';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Bar */}
      <motion.nav
        className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/communities')}
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex items-center gap-1">
                {['comunidad', 'miembros', 'ligas', 'acerca'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en esta comunidad..."
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Community Header */}
      <motion.section
        className={`relative py-16 px-6 overflow-hidden ${communityStyle.background}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            className="flex items-start justify-between"
            variants={itemVariants}
          >
            <div className="flex items-start gap-6">
              {/* Community Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {community.name}
                </h1>
                <p className="text-xl text-white/90 mb-4 max-w-2xl">
                  {community.description}
                </p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="w-4 h-4" />
                    {community.member_count} Miembros
                  </div>
                  <div className={`flex items-center gap-2 ${communityStyle.accent}`}>
                    {community.access_type === 'free' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {community.access_type === 'free' ? 'Acceso Gratuito' : 'Por Invitación'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              {getAccessButton()}
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">24</div>
                <div className="text-slate-400 text-sm">POSTS</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">7</div>
                <div className="text-slate-400 text-sm">COMENTARIOS</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">11</div>
                <div className="text-slate-400 text-sm">REACCIONES</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.section
        className="px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          {canViewContent ? (
            <>
              {/* Create Post Card - Solo para miembros */}
              {community.is_member && (
                <motion.div
                  variants={cardVariants}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                      {user?.profile_picture_url ? (
                        <img 
                          src={user.profile_picture_url} 
                          alt={user?.first_name || 'Usuario'}
                          className="w-full h-full object-cover"
                        />
                      ) : user?.first_name && user?.last_name ? (
                        <span className="text-white font-semibold text-sm">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </span>
                      ) : user?.username ? (
                        <span className="text-white font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <Users className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Escribe algo para la comunidad..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button className="btn-secondary">
                            <Plus className="w-4 h-4 mr-2" />
                            Adjuntar
                          </Button>
                        </div>
                        <Button
                          onClick={handleCreatePost}
                          disabled={!newPostContent.trim() || isCreatingPost}
                          className="btn-primary disabled:opacity-50"
                        >
                          {isCreatingPost ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          {isCreatingPost ? 'Publicando...' : 'Publicar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Posts Feed */}
              <motion.div
                variants={containerVariants}
                className="space-y-6"
              >
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    variants={cardVariants}
                    whileHover="hover"
                    className="community-post"
                  >
                    {/* Post Header */}
                    <div className="community-post-header">
                      <div className="flex items-center gap-3">
                        <div className="community-post-avatar">
                          {post.user?.profile_picture_url ? (
                            <img 
                              src={post.user.profile_picture_url} 
                              alt={post.user?.first_name || 'Usuario'}
                              className="w-full h-full object-cover"
                            />
                          ) : post.user?.first_name && post.user?.last_name ? (
                            <span className="text-white font-semibold text-sm">
                              {post.user.first_name.charAt(0)}{post.user.last_name.charAt(0)}
                            </span>
                          ) : post.user?.username ? (
                            <span className="text-white font-semibold text-sm">
                              {post.user.username.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <Users className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {post.user?.first_name && post.user?.last_name 
                              ? `${post.user.first_name} ${post.user.last_name}`
                              : post.user?.username || post.user?.email || 'Usuario'
                            }
                          </h3>
                          <p className="text-sm text-slate-400">
                            Hace {Math.floor(Math.random() * 30)} días • general
                          </p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="community-post-content">
                      <p>{post.content}</p>
                    </div>

                    {/* Post Attachments */}
                    {(post.attachment_url || post.attachment_data) && (
                      <div className="mb-4">
                        {(() => {
                          // Debug: ver datos del post antes de renderizar AttachmentViewer
                          console.log('🔍 POST DATA before AttachmentViewer:', {
                            postId: post.id,
                            attachment_type: post.attachment_type,
                            attachment_url: post.attachment_url,
                            attachment_data: post.attachment_data,
                            title: post.title
                          });
                          return null;
                        })()}
                        <AttachmentViewer
                          attachmentUrl={post.attachment_url}
                          attachmentType={post.attachment_type || 'application/octet-stream'}
             attachmentData={post.attachment_data}
                          fileName={post.title || undefined}
             postId={post.id}
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="community-post-actions">
                      <ReactionButton
                        postId={post.id}
                        currentReaction={postReactions[post.id]?.type || null}
                        reactionCount={postReactions[post.id]?.count || post.reaction_count || 0}
                        onReaction={handleReaction}
                      />
                      <button 
                        onClick={() => {
                          // Check if comments are currently showing for this post
                          const isCurrentlyShowing = showCommentsForPost[post.id] || false;
                          
                          // Toggle comments section for this post
                          setShowCommentsForPost(prev => ({
                            ...prev,
                            [post.id]: !prev[post.id]
                          }));
                          
                          // Only scroll if we're opening the comments (not closing)
                          if (!isCurrentlyShowing) {
                            setTimeout(() => {
                              const commentsSection = document.getElementById(`comments-${post.id}`);
                              if (commentsSection) {
                                commentsSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }
                        }}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments_count}</span>
                      </button>
                      <ShareButton
                        postId={post.id}
                        postContent={post.content}
                        communityName={community.name}
                        communitySlug={slug}
                      />
                    </div>

                    {/* Sección de comentarios */}
                    <div id={`comments-${post.id}`}>
                      <LocalCommentsSection
                        postId={post.id}
                        communitySlug={slug}
                        showComments={showCommentsForPost[post.id] || false}
                        setShowComments={(show: boolean) => {
                          setShowCommentsForPost(prev => ({
                            ...prev,
                            [post.id]: show
                          }));
                        }}
                        onCommentAdded={(comment: any) => {
                          // Actualizar contador de comentarios
                          setPosts(prev => prev.map(p => 
                            p.id === post.id 
                              ? { ...p, comments_count: p.comments_count + 1 }
                              : p
                          ));
                        }}
                      />
                    </div>
                  </motion.div>
                ))}

                {posts.length === 0 && (
                  <motion.div
                    variants={cardVariants}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No hay posts aún
                    </h3>
                    <p className="text-slate-400">
                      Sé el primero en compartir algo en esta comunidad
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </>
          ) : (
            /* Preview Mode for Non-Members */
            <motion.div
              variants={cardVariants}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                <EyeOff className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Contenido restringido
              </h3>
              <p className="text-slate-400 mb-6">
                {community.access_type === 'free' 
                  ? 'Únete a esta comunidad para ver todo el contenido'
                  : 'Esta comunidad es solo por invitación'
                }
              </p>
              {getAccessButton()}
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
