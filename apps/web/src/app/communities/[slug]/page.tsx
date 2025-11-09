'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  Info,
  Trophy,
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
import { ReactionBanner } from '../../../features/communities/components/ReactionBanner';
import { PostInteractions } from '../../../features/communities/components/PostInteractions';
import { useReactions, useAttachments } from '../../../features/communities/hooks';

// Lazy loading de componentes pesados de communities
const ReactionDetailsModal = dynamic(() => import('../../../features/communities/components/ReactionDetailsModal').then(mod => ({ default: mod.ReactionDetailsModal })), {
  ssr: false
});
const CommentsSection = dynamic(() => import('../../../features/communities/components/CommentsSection').then(mod => ({ default: mod.CommentsSection })), {
  ssr: false
});
const YouTubeLinkModal = dynamic(() => import('../../../features/communities/components/AttachmentModals/YouTubeLinkModal').then(mod => ({ default: mod.YouTubeLinkModal })), {
  ssr: false
});
const PollModal = dynamic(() => import('../../../features/communities/components/AttachmentModals/PollModal').then(mod => ({ default: mod.PollModal })), {
  ssr: false
});
const InfinitePostsFeed = dynamic(() => import('../../../features/communities/components/InfinitePostsFeed').then(mod => ({ default: mod.InfinitePostsFeed })), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="community-post animate-pulse">
          <div className="h-48 bg-slate-800/50 rounded-lg" />
        </div>
      ))}
    </div>
  )
});
import { InlineAttachmentButtons, AttachmentPreview, PostAttachment } from '../../../features/communities/components';
import { formatRelativeTime } from '../../../core/utils/date-utils';
// import { ShareButton } from '../../../../features/communities/components/ShareButton';
// import { AttachmentViewer } from '../../../../features/communities/components/AttachmentViewer';
// import { useAuth } from '../../../features/auth/hooks/useAuth';

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
      // console.error('Error fetching comments:', error);
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
        // console.error('Error creating comment:', errorData.error);
        alert('Error al crear el comentario: ' + errorData.error);
      }
    } catch (error) {
      // console.error('Error creating comment:', error);
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
            <div className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
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
                  className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.first_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.user?.first_name && comment.user?.last_name 
                            ? `${comment.user.first_name} ${comment.user.last_name}`
                            : comment.user?.username || 'Usuario'
                          }
                        </span>
                        <span className="text-gray-600 dark:text-slate-400 text-sm">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-slate-200">{comment.content}</p>
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

function ShareButton({ postId, postContent, communityName, communitySlug, isFacebookStyle = false }: any) {
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
      // console.error('Error copying to clipboard:', err);
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

  // Estilo de Facebook
  if (isFacebookStyle) {
    return (
      <div className="relative" ref={buttonRef}>
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-3 shadow-2xl backdrop-blur-sm z-50 min-w-[200px]"
            >
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(postUrl)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-900 dark:text-slate-200 text-sm">Copiar enlace</span>
                </button>
                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Twitter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-900 dark:text-slate-200 text-sm">Compartir en Twitter</span>
                </button>
                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-900 dark:text-slate-200 text-sm">Compartir en Facebook</span>
                </button>
              </div>

              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600"
                  >
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
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

  return (
    <div className="relative" ref={buttonRef}>
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
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
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-3 shadow-2xl backdrop-blur-sm z-50 min-w-[200px]"
          >
            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(postUrl)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-slate-200 text-sm">Copiar enlace</span>
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Twitter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-slate-200 text-sm">Compartir en Twitter</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-slate-200 text-sm">Compartir en Facebook</span>
              </button>
            </div>

            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
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

  // console.log('🎯 PollViewer received data:', pollData);
  // console.log('🎯 PollViewer - Raw pollData keys:', Object.keys(pollData || {}));

  // Normalizar los datos de la encuesta
  const normalizedData = {
    question: currentPollData.question || currentPollData.title || 'Encuesta',
    options: currentPollData.options || currentPollData.choices || currentPollData.responses || []
  };
  
  // console.log('🎯 PollViewer - Normalized data:', normalizedData);

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
        // console.error('Error obteniendo voto del usuario:', error);
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
          
          // console.log('✅ Voto procesado:', data.message);
        }
      } else {
        const errorData = await response.json();
        // console.error('Error en votación:', errorData.error);
        // Aquí podrías mostrar un toast de error
      }
    } catch (error) {
      // console.error('Error enviando voto:', error);
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
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-800/80 dark:via-slate-900/60 dark:to-slate-800/80 border border-gray-200 dark:border-slate-700/40 backdrop-blur-xl shadow-2xl mb-6"
      >
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 border-b border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center gap-4 p-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-gray-900 dark:text-white font-bold text-xl mb-1">
                {normalizedData.question}
              </h4>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Selecciona tu respuesta</p>
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
                  ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-r from-blue-500/20 dark:from-blue-500/20 via-blue-500/10 dark:via-blue-500/10 to-indigo-500/20 dark:to-indigo-500/20 shadow-lg shadow-blue-500/30 scale-[1.02]' 
                  : 'border-gray-300 dark:border-slate-600/50 bg-gray-50 dark:bg-slate-800/40 hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/20'
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
                    <span className="text-gray-900 dark:text-white font-semibold text-lg">
                      {optionKey}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {percentage}%
                    </div>
                    <div className="text-gray-600 dark:text-slate-400 text-sm">
                      {voteCount} votos
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso mejorada */}
                {hasVoted && (
                  <div className="relative">
                    <div className="w-full h-3 bg-gray-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
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
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800/50 dark:to-slate-900/50 border-t border-gray-200 dark:border-slate-700/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-gray-700 dark:text-slate-300 font-medium">
              {totalVotes} votos totales
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 bg-gray-200 dark:bg-slate-700/30 rounded-lg px-3 py-2 border border-gray-300 dark:border-slate-600/30">
              <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Procesando voto...</span>
            </div>
          ) : hasVoted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 bg-gray-200 dark:bg-slate-700/30 rounded-lg px-3 py-2 border border-gray-300 dark:border-slate-600/30"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  // console.log('🔍 AttachmentViewer props:', {
  //   attachmentUrl,
  //   attachmentType,
  //   attachmentData,
  //   fileName,
  //   isPoll: attachmentType === 'poll',
  //   hasAttachmentData: !!attachmentData
  // });
  
  // Debug más detallado para encuestas
  if (attachmentType === 'poll') {
    // console.log('🎯 POLL DETECTED - Full data:', {
    //   attachmentType,
    //   attachmentData,
    //   attachmentUrl,
    //   fileName
    // });
  }

  // Si es una encuesta, renderizar el componente de encuesta
  // Verificar diferentes tipos de encuestas
  const isPoll = attachmentType === 'poll' || 
                 attachmentType === 'encuesta' || 
                 attachmentType === 'survey' ||
                 (attachmentData && (attachmentData.question || attachmentData.options));
  
  if (isPoll && attachmentData) {
    // console.log('✅ Rendering PollViewer with data:', attachmentData);
    return <PollViewer pollData={attachmentData} postId={postId} />;
  }

  // Debug: si parece ser poll pero no tiene datos
  if (isPoll && !attachmentData) {
    // console.log('❌ Poll type detected but no attachment data:', { attachmentType, attachmentData });
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
              <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3" />
                  <p className="text-lg text-gray-900 dark:text-white">Error al cargar la imagen</p>
                </div>
              </div>
            )}
            
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
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
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 dark:from-blue-500/10 dark:via-purple-500/5 dark:to-indigo-500/10 border border-blue-400/20 dark:border-blue-400/20 hover:border-blue-400/40 dark:hover:border-blue-400/40 transition-all duration-300 mb-4 backdrop-blur-sm"
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
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h4 className="text-gray-900 dark:text-white font-semibold text-lg truncate">
                  {pageName}
                </h4>
              </div>
              
              <p className="text-blue-600 dark:text-blue-200/80 text-sm mb-3 font-medium">
                {fileName || 'Enlace web'}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400/70 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-400/20 dark:border-blue-400/20">
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
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 dark:from-slate-500/10 via-gray-50 dark:via-gray-500/5 to-gray-100 dark:to-slate-500/10 border border-gray-300 dark:border-slate-400/20 hover:border-gray-400 dark:hover:border-slate-400/40 transition-all duration-300 mb-4 backdrop-blur-sm"
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
                <File className="w-5 h-5 text-gray-600 dark:text-slate-400 flex-shrink-0" />
                <h4 className="text-gray-900 dark:text-white font-semibold text-lg truncate">
                  {documentName}
                </h4>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-700 dark:text-slate-300/80 text-sm font-medium">
                  {attachmentType || 'Archivo adjunto'}
                </span>
                <div className="w-1 h-1 bg-gray-400 dark:bg-slate-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-slate-400/70 text-xs">
                  Documento
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400/70 bg-gray-200 dark:bg-slate-500/10 rounded-lg px-3 py-2 border border-gray-300 dark:border-slate-400/20">
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
        // console.error('Error getting session:', error);
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
      // console.error('Error during logout:', error);
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
  comment_count: number;
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

const MOBILE_BOTTOM_NAV_HEIGHT = 72;
const MOBILE_CONTENT_EXTRA_PADDING = 24;

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
  const [postAttachment, setPostAttachment] = useState<{ type: string; data: any } | null>(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pendingAttachmentType, setPendingAttachmentType] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<Record<string, { type: string | null; count: number }>>({});
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({});
  const [showReactionDetails, setShowReactionDetails] = useState<Record<string, boolean>>({});
  const [selectedReactionType, setSelectedReactionType] = useState<string | null>(null);
  const [postReactionStats, setPostReactionStats] = useState<Record<string, any>>({});
  const communityHeaderRef = useRef<HTMLElement | null>(null);
  const feedSectionRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (slug) {
      // console.log('🚀 Loading community in parallel mode');
      console.time('Total Community Load');
      
      // ✅ Ejecutar ambas llamadas en PARALELO en lugar de secuencial
      Promise.all([
        fetchCommunityDetail(),
        fetchPosts()
      ]).then(() => {
        console.timeEnd('Total Community Load');
        // console.log('✅ Community fully loaded');
      }).catch(error => {
        // console.error('❌ Error loading community:', error);
      });
    }
  }, [slug]);

  useEffect(() => {
    const checkViewport = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const communityTabs = [
    { id: 'comunidad', label: 'Comunidad', icon: MessageSquare },
    { id: 'miembros', label: 'Miembros', icon: Users, href: `/communities/${slug}/members` },
    { id: 'ligas', label: 'Ligas', icon: Trophy, href: `/communities/${slug}/leagues` },
    { id: 'acerca', label: 'Acerca', icon: Info },
  ];

  const handleTabNavigation = (tabId: string) => {
    setActiveTab(tabId);

    if (tabId === 'miembros') {
      router.push(`/communities/${slug}/members`);
      return;
    }

    if (tabId === 'ligas') {
      router.push(`/communities/${slug}/leagues`);
      return;
    }

    if (tabId === 'acerca') {
      if (communityHeaderRef.current) {
        communityHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (tabId === 'comunidad' && feedSectionRef.current) {
      feedSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchCommunityDetail = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data.community);
      } else {
        // console.error('Error fetching community:', response.statusText);
      }
    } catch (error) {
      // console.error('Error fetching community:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}/posts`);
      if (response.ok) {
        const data = await response.json();
        // console.log('📊 Posts data received:', data.posts);
        
        // Debug: buscar posts con encuestas
        const pollPosts = data.posts?.filter((post: any) => post.attachment_type === 'poll');
        // console.log('🔍 Poll posts found:', pollPosts);
        
        setPosts(data.posts || []);
        
        // Cargar reacciones del usuario para cada post
        if (data.posts && data.posts.length > 0) {
          await loadUserReactions(data.posts);
        }
      } else {
        const errorData = await response.json();
        // console.error('Error fetching posts:', errorData);
        
        // Si es error de autenticación, no mostrar posts pero permitir ver la comunidad
        if (response.status === 401 && errorData.requires_auth) {
          setPosts([]);
        } else if (response.status === 403 && errorData.requires_membership) {
          setPosts([]);
        }
      }
    } catch (error) {
      // console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserReactions = async (posts: Post[]) => {
    try {
      if (posts.length === 0) return;

      const postIds = posts.map(post => post.id);
      
      // console.log(`🚀 Loading reactions for ${postIds.length} posts using batch endpoint`);
      console.time('Batch Reactions Load');

      // ✅ 1 SOLA LLAMADA HTTP para obtener todas las reacciones
      const response = await fetch(`/api/communities/${slug}/posts/reactions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds }),
      });

      if (!response.ok) {
        // console.error('Error loading batch reactions:', response.statusText);
        return;
      }

      const data = await response.json();
      console.timeEnd('Batch Reactions Load');
      // console.log(`✅ Batch reactions loaded successfully for ${data.totalPosts} posts`);

      // Mapear los datos recibidos al formato esperado
      const userReactionsMap: Record<string, string | null> = {};
      const reactionStatsMap: Record<string, any> = {};
      
      Object.entries(data.reactionsByPost).forEach(([postId, postData]: [string, any]) => {
        userReactionsMap[postId] = postData.userReaction;
        reactionStatsMap[postId] = postData.reactions;
      });

      setUserReactions(userReactionsMap);
      setPostReactionStats(reactionStatsMap);

    } catch (error) {
      // console.error('Error loading user reactions:', error);
    }
  };

  const handleAttachmentSelect = (type: string, data: any) => {
    if (type === 'youtube' || type === 'link') {
      setPendingAttachmentType(type);
      setShowYouTubeModal(true);
    } else if (type === 'poll') {
      setShowPollModal(true);
    } else {
      // Para archivos (imagen, documento, video)
      setPostAttachment({ type, data });
    }
  };

  const handleYouTubeLinkConfirm = (url: string, type: 'youtube' | 'link') => {
    setPostAttachment({ 
      type, 
      data: { url, name: type === 'youtube' ? 'Video de YouTube' : 'Enlace web' }
    });
    setShowYouTubeModal(false);
    setPendingAttachmentType(null);
  };

  const handlePollConfirm = (pollData: any) => {
    setPostAttachment({ type: 'poll', data: pollData });
    setShowPollModal(false);
  };

  const handleRemoveAttachment = () => {
    setPostAttachment(null);
  };

  const { createPostWithAttachment, isProcessing: isProcessingAttachment, error: attachmentError } = useAttachments();

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !community) return;
    
    setIsCreatingPost(true);
    try {
      // Preparar datos del adjunto si existe
      let attachmentData = null;
      if (postAttachment) {
        attachmentData = {
          type: postAttachment.type,
          ...postAttachment.data
        };
        // console.log('🎥 [YOUTUBE] handleCreatePost - TIPO ANTES DE ENVIAR:', postAttachment.type, attachmentData);
      }

      const result = await createPostWithAttachment(slug, newPostContent, attachmentData);
      
      // Agregar el nuevo post al inicio de la lista
      setPosts(prev => [result.post, ...prev]);
      setNewPostContent('');
      setPostAttachment(null);
      
      // Actualizar contador de posts en la comunidad
      setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
      
    } catch (error) {
      // console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el post';
      alert(errorMessage);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleReactionClick = (postId: string, reactionType: string) => {
    setSelectedReactionType(reactionType);
    setShowReactionDetails(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  const closeReactionDetails = (postId: string) => {
    setShowReactionDetails(prev => ({
      ...prev,
      [postId]: false
    }));
    setSelectedReactionType(null);
  };

  const handleReaction = async (postId: string, reactionType: string | null) => {
    try {
      // Determinar la acción basada en la reacción actual del usuario
      const currentUserReaction = userReactions[postId];
      let action = 'add';
      let typeToSend = reactionType;
      
      if (reactionType === null) {
        // Si queremos quitar la reacción, necesitamos enviar el tipo actual
        action = 'remove';
        typeToSend = currentUserReaction;
      } else if (currentUserReaction === reactionType) {
        // Si clickeamos en la misma reacción, quitarla
        action = 'remove';
        typeToSend = reactionType;
      } else if (currentUserReaction && currentUserReaction !== reactionType) {
        // Cambiar de una reacción a otra
        action = 'update';
        typeToSend = reactionType;
      }

      // Si no hay reacción actual y queremos quitar, no hacer nada
      if (action === 'remove' && !typeToSend) {
        return;
      }

      const response = await fetch(`/api/communities/${slug}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reaction_type: typeToSend,
          action: action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el estado local de reacciones
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            type: data.action === 'removed' ? null : reactionType,
            count: data.action === 'added' 
              ? (prev[postId]?.count || 0) + 1
              : data.action === 'removed'
              ? Math.max((prev[postId]?.count || 0) - 1, 0)
              : (prev[postId]?.count || 0) // Para 'updated' y 'none' no cambia el conteo
          }
        }));

        // Actualizar las reacciones del usuario
        setUserReactions(prev => ({
          ...prev,
          [postId]: data.action === 'removed' ? null : reactionType
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
                  : post.reaction_count // Para 'updated' y 'none' no cambia el conteo
              }
            : post
        ));

        // Recargar las estadísticas de reacciones para este post
        try {
          const statsResponse = await fetch(`/api/communities/${slug}/posts/${postId}/reactions?include_stats=true`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setPostReactionStats(prev => ({
              ...prev,
              [postId]: statsData.reactions || {}
            }));
          }
        } catch (error) {
          // console.error('Error reloading reaction stats:', error);
        }
      } else {
        const errorData = await response.json();
        // console.error('Error handling reaction:', errorData.error);
      }
    } catch (error) {
      // console.error('Error handling reaction:', error);
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
          // console.error('Error joining community:', errorData.error);
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
          // console.error('Error requesting access:', errorData.error);
        }
      }
    } catch (error) {
      // console.error('Error joining community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getCommunityStyle = (community: Community) => {
    if (community.slug === 'profesionales') {
      return {
        background: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        accent: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30 dark:border-blue-500/30'
      };
    } else if (community.slug === 'ecos-liderazgo') {
      return {
        background: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-purple-600 to-purple-700',
        accent: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/30 dark:border-orange-500/30'
      };
    } else if (community.slug === 'openminder') {
      return {
        background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900/50 dark:to-black/60',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-900',
        accent: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-500/30 dark:border-yellow-500/30'
      };
    }
    
    return {
      background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-900/60',
      headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
      accent: 'text-gray-600 dark:text-slate-400',
      border: 'border-gray-300 dark:border-slate-600/30'
    };
  };

  const getAccessButton = () => {
    if (!community) return null;

    if (community.is_member) {
      return (
        <Button
          className="w-full sm:w-auto bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
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
          className="w-full sm:w-auto bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30"
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
              className="w-full sm:w-auto bg-slate-600/50 text-slate-400 border border-slate-600/50"
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
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
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
        className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comunidad no encontrada</h1>
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
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900"
      style={
        isMobile
          ? {
              paddingBottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
            }
          : undefined
      }
    >
      {/* Navigation Bar */}
      <motion.nav
        className="hidden md:block bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={() => router.push('/communities')}
                className="bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex items-center gap-2 flex-wrap">
                {communityTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabNavigation(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en esta comunidad..."
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Community Header */}
      <motion.section
        ref={communityHeaderRef}
        className={`relative py-16 px-6 overflow-hidden ${communityStyle.background}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Community Image as Background */}
        {community.image_url ? (
          <div className="absolute inset-0">
            <img
              src={community.image_url}
              alt={community.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Si la imagen falla al cargar, mostrar el gradiente
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const gradient = target.nextElementSibling as HTMLElement;
                if (gradient) gradient.style.display = 'block';
              }}
            />
            {/* Overlay oscuro para mejorar legibilidad del texto */}
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ) : (
          <>
            {/* Background Effects - solo si no hay imagen */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/10 dark:to-purple-500/10" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/5 rounded-full blur-3xl" />
          </>
        )}
        
        <div className="relative max-w-7xl mx-auto z-10">
          <motion.div
            className="flex flex-col lg:flex-row items-start justify-between gap-8"
            variants={itemVariants}
          >
            <div className="w-full flex mb-4 md:hidden">
              <Button
                onClick={() => router.push('/communities')}
                className="bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Comunidades
              </Button>
            </div>

            <div className="flex items-start gap-6 w-full">
              {/* Community Avatar - solo si no hay imagen de fondo */}
              {!community.image_url && (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {community.name}
                </h1>
                <p className="text-lg md:text-xl text-gray-800 dark:text-white/90 mb-4 max-w-2xl">
                  {community.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-white/80">
                    <Users className="w-4 h-4" />
                    {community.member_count} Miembros
                  </div>
                  <div className={`flex items-center gap-2 ${communityStyle.accent} dark:${communityStyle.accent}`}>
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

            <div className="w-full lg:w-auto flex flex-col lg:items-end gap-4">
              <div className="w-full lg:w-auto">{getAccessButton()}</div>
              
              <div className="flex flex-wrap gap-4 text-gray-600 dark:text-slate-400">
                <div className="min-w-[90px]">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
                  <div className="text-xs font-medium uppercase tracking-wide">Posts</div>
                </div>
                <div className="min-w-[90px]">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">7</div>
                  <div className="text-xs font-medium uppercase tracking-wide">Comentarios</div>
                </div>
                <div className="min-w-[90px]">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">11</div>
                  <div className="text-xs font-medium uppercase tracking-wide">Reacciones</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.section
        ref={feedSectionRef}
        className="px-4 md:px-6 pt-8"
        style={{
          paddingBottom: isMobile
            ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_CONTENT_EXTRA_PADDING}px)`
            : '4rem',
        }}
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
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-600/50 rounded-2xl p-6 mb-6 shadow-lg dark:shadow-xl"
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
                        className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 resize-none focus:outline-none"
                        rows={3}
                      />
                      {/* Preview del adjunto */}
                      {postAttachment && (
                        <div className="mt-4">
                          <AttachmentPreview
                            type={postAttachment.type}
                            data={postAttachment.data}
                            onRemove={handleRemoveAttachment}
                          />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 gap-4">
                        <div className="w-full sm:flex-1">
                          <InlineAttachmentButtons
                            onAttachmentSelect={handleAttachmentSelect}
                          />
                        </div>
                        <div className="flex-shrink-0 sm:w-auto w-full">
                          <Button
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || isCreatingPost || isProcessingAttachment}
                            className="btn-primary disabled:opacity-50 w-full sm:w-auto justify-center"
                          >
                            {(isCreatingPost || isProcessingAttachment) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            {(isCreatingPost || isProcessingAttachment) ? 'Publicando...' : 'Publicar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Posts Feed with Infinite Scroll */}
              <InfinitePostsFeed
                communitySlug={slug}
                initialPosts={posts}
                onPostsUpdate={(updatedPosts) => setPosts(updatedPosts as any)}
                renderPost={(post, index) => (
                  <motion.div
                    key={post.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
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
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {post.user?.first_name && post.user?.last_name 
                              ? `${post.user.first_name} ${post.user.last_name}`
                              : post.user?.username || post.user?.email || 'Usuario'
                            }
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {formatRelativeTime(post.created_at)} • general
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="community-post-content">
                      <p className="text-gray-900 dark:text-white">{post.content}</p>
                    </div>

                    {/* Post Attachments */}
                    {post.attachment_type && (
                      <PostAttachment
                        attachmentType={post.attachment_type}
                        attachmentUrl={post.attachment_url}
                        attachmentData={post.attachment_data}
                        postId={post.id}
                        communitySlug={slug}
                      />
                    )}

                    {/* Facebook-style Post Stats Bar - Reacciones y comentarios */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-4 text-sm text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700/30">
                      {/* Reacciones */}
                      {(() => {
                        const totalReactions = postReactions[post.id]?.count || post.reaction_count || 0;
                        const reactionStats = postReactionStats[post.id] || {};
                        const topReactions = Object.values(reactionStats).map((reaction: any) => ({
                          reaction_type: reaction.type,
                          count: reaction.count,
                          emoji: reaction.emoji
                        }));
                        
                        // console.log('Post reaction data:', {
                        //   postId: post.id,
                        //   totalReactions,
                        //   reactionStats,
                        //   topReactions,
                        //   postReactions: postReactions[post.id],
                        //   postReactionCount: post.reaction_count
                        // });
                        
                        return (
                          <ReactionBanner
                            totalReactions={totalReactions}
                            topReactions={topReactions}
                            showTopReactions={true}
                            onReactionClick={(reactionType) => handleReactionClick(post.id, reactionType)}
                            postId={post.id}
                          />
                        );
                      })()}
                      
                      {/* Comentarios */}
                      <button 
                        onClick={() => {
                          const isCurrentlyShowing = showCommentsForPost[post.id] || false;
                          setShowCommentsForPost(prev => ({
                            ...prev,
                            [post.id]: !prev[post.id]
                          }));
                          if (!isCurrentlyShowing) {
                            setTimeout(() => {
                              const commentsSection = document.getElementById(`comments-${post.id}`);
                              if (commentsSection) {
                                commentsSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }
                        }}
                        className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {post.comment_count} comentarios
                      </button>
                    </div>

                    {/* Facebook-style Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-2 border-t border-gray-200 dark:border-slate-700/30">
                      {/* Botón de Reacciones */}
                      <div className="flex-1 min-w-[150px]">
                        <ReactionButton
                          postId={post.id}
                          currentReaction={userReactions[post.id] || null}
                          reactionCount={postReactions[post.id]?.count || post.reaction_count || 0}
                          onReaction={handleReaction}
                          isFacebookStyle={true}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const isCurrentlyShowing = showCommentsForPost[post.id] || false;
                          setShowCommentsForPost(prev => ({
                            ...prev,
                            [post.id]: !prev[post.id]
                          }));
                          if (!isCurrentlyShowing) {
                            setTimeout(() => {
                              const commentsSection = document.getElementById(`comments-${post.id}`);
                              if (commentsSection) {
                                commentsSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }
                        }}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Comentar</span>
                      </button>
                      <div className="flex-1 min-w-[150px] flex justify-center">
                        <ShareButton
                          postId={post.id}
                          postContent={post.content}
                          communityName={community.name}
                          communitySlug={slug}
                          isFacebookStyle={true}
                        />
                      </div>
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
                              ? { ...p, comment_count: p.comment_count + 1 }
                              : p
                          ));
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              />
            </>
          ) : (
            /* Preview Mode for Non-Members */
            <motion.div
              variants={cardVariants}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center">
                <EyeOff className="w-12 h-12 text-gray-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Contenido restringido
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 shadow-2xl"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex items-center justify-around px-4 py-3">
            {communityTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigation(tab.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}

      {/* Modales de detalles de reacciones */}
      {posts.map((post) => (
        <ReactionDetailsModal
          key={`reaction-modal-${post.id}`}
          isOpen={showReactionDetails[post.id] || false}
          onClose={() => closeReactionDetails(post.id)}
          postId={post.id}
          communitySlug={slug}
          selectedReactionType={selectedReactionType || undefined}
        />
      ))}

      {/* Modales de adjuntos */}
      <YouTubeLinkModal
        isOpen={showYouTubeModal}
        onClose={() => {
          setShowYouTubeModal(false);
          setPendingAttachmentType(null);
        }}
        onConfirm={handleYouTubeLinkConfirm}
        type={pendingAttachmentType as 'youtube' | 'link' || 'link'}
      />

      <PollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onConfirm={handlePollConfirm}
      />
    </div>
  );
}
