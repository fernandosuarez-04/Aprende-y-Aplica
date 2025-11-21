'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  MessageCircle,
  User,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { CommentItem } from './CommentItem';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

interface CommentsPanelProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  isMobile: boolean;
  onCommentAdded?: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  reelId,
  isOpen,
  onClose,
  commentCount,
  isMobile,
  onCommentAdded
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar comentarios
  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reels/${reelId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      // console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        
        // Notificar al componente padre que se agregó un comentario
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
      // console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar comentarios cuando se abre el panel
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, reelId]);

  // Filtrar comentarios por búsqueda
  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.users.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`absolute bg-white dark:bg-gray-900 shadow-2xl flex flex-col ${
            isMobile 
              ? 'bottom-0 left-0 right-0 h-4/5 rounded-t-3xl' 
              : 'top-0 right-0 w-[420px] h-full rounded-l-3xl'
          }`}
          data-comments-panel
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-3xl">
            <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Comentarios
                  </h2>
                  <p className="text-white/80 text-sm">
                    {commentCount} comentario{commentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar comentarios..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Comentarios */}
          <div 
            className="flex-1 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando comentarios...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No se encontraron comentarios' : 'No hay comentarios aún'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : '¡Sé el primero en comentar!'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {filteredComments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <CommentItem 
                        comment={comment} 
                        onReplyAdded={onCommentAdded}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Input de comentario mejorado */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmitComment} className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
