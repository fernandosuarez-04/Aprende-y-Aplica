'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Users, Reply } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_edited: boolean;
  user: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  communitySlug: string;
  initialComments?: Comment[];
  onCommentAdded?: (comment: Comment) => void;
}

export function CommentsSection({ 
  postId, 
  communitySlug, 
  initialComments = [], 
  onCommentAdded 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`);
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

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Agregar la respuesta al comentario correspondiente
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), data.comment] }
            : comment
        ));
        setReplyContent('');
        setReplyingTo(null);
      } else {
        const errorData = await response.json();
        console.error('Error creating reply:', errorData.error);
        alert('Error al crear la respuesta: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Error al crear la respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Usuario';
  };

  const getUserInitials = (user: Comment['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="mt-4">
      {/* Botón para mostrar/ocultar comentarios */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-4"
      >
        <MessageSquare className="w-4 h-4" />
        <span>{comments.length} comentarios</span>
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Formulario de nuevo comentario */}
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

            {/* Lista de comentarios */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                      {comment.user.profile_picture_url ? (
                        <img 
                          src={comment.user.profile_picture_url} 
                          alt={getUserDisplayName(comment.user)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getUserInitials(comment.user)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {getUserDisplayName(comment.user)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-200 mb-3">{comment.content}</p>
                      
                      {/* Botón de responder */}
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-sm"
                      >
                        <Reply className="w-3 h-3" />
                        Responder
                      </button>

                      {/* Formulario de respuesta */}
                      <AnimatePresence>
                        {replyingTo === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 bg-slate-700/30 rounded-lg p-3"
                          >
                            <div className="flex gap-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Escribe una respuesta..."
                                className="flex-1 bg-slate-600/50 border border-slate-500/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                                rows={2}
                              />
                              <Button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Respuestas */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-slate-700/30 rounded-lg p-3">
                              <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                                  {reply.user.profile_picture_url ? (
                                    <img 
                                      src={reply.user.profile_picture_url} 
                                      alt={getUserDisplayName(reply.user)}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    getUserInitials(reply.user)
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white text-sm">
                                      {getUserDisplayName(reply.user)}
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                      {formatTimeAgo(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-sm">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
