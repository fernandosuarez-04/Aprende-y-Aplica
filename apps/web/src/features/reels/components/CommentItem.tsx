'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart,
  MessageCircle,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { sanitizeComment } from '../../../lib/sanitize/html-sanitizer';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

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

interface CommentItemProps {
  comment: Comment;
  onReplyAdded?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplyAdded }) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  // Cargar respuestas
  const loadReplies = async () => {
    try {
      setIsLoadingReplies(true);
      const response = await fetch(`/api/reels/comments/${comment.id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Enviar respuesta
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || isSubmittingReply) return;

    try {
      setIsSubmittingReply(true);
      const response = await fetch(`/api/reels/comments/${comment.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply.trim() }),
      });

      if (response.ok) {
        const newReplyData = await response.json();
        setReplies(prev => [...prev, newReplyData]);
        setNewReply('');
        setShowReplyInput(false);
        
        if (onReplyAdded) {
          onReplyAdded();
        }
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Cargar respuestas cuando se expanden
  useEffect(() => {
    if (showReplies && replies.length === 0) {
      loadReplies();
    }
  }, [showReplies]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Ahora';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      {/* Comentario Principal */}
      <div className="flex space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg">
            {comment.users.profile_picture_url ? (
              <img
                src={comment.users.profile_picture_url}
                alt={comment.users.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Contenido del comentario */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.users.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <p 
            className="text-sm text-gray-800 dark:text-gray-200 mb-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeComment(comment.content) }}
          />
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors group"
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Responder</span>
            </button>
          </div>

          {/* Input de respuesta */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <form onSubmit={handleSubmitReply} className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Escribe una respuesta..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={isSubmittingReply}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newReply.trim() || isSubmittingReply}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    {isSubmittingReply ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón para mostrar respuestas */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors mt-2 text-sm font-medium"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Ocultar {replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Ver {replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Respuestas */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-3"
          >
            {isLoadingReplies ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              replies.map((reply) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                >
                  {/* Avatar de respuesta */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center ring-1 ring-white dark:ring-gray-800">
                      {reply.users.profile_picture_url ? (
                        <img
                          src={reply.users.profile_picture_url}
                          alt={reply.users.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Contenido de la respuesta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white">
                        {reply.users.username}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p 
                      className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeComment(reply.content) }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
