'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Heart, ThumbsUp, Laugh, Angry, Frown } from 'lucide-react';

// Componente SVG personalizado para cara de sorpresa 😮
const SurprisedFace = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="9" r="0.4" fill="currentColor" />
    <circle cx="16" cy="9" r="0.4" fill="currentColor" />
    <circle cx="12" cy="15" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface ReactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  communitySlug: string;
  selectedReactionType?: string;
}

interface ReactionUser {
  id: string;
  name: string;
  avatar?: string;
  reaction_type: string;
  created_at: string;
}

interface ReactionStats {
  reaction_type: string;
  count: number;
  emoji: string;
  users: ReactionUser[];
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  wow: SurprisedFace,
  sad: Frown,
  angry: Angry,
};

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

const reactionLabels = {
  like: 'Me gusta',
  love: 'Me encanta',
  laugh: 'Me divierte',
  wow: 'Me asombra',
  sad: 'Me entristece',
  angry: 'Me enoja',
};

export function ReactionDetailsModal({ 
  isOpen, 
  onClose, 
  postId, 
  communitySlug,
  selectedReactionType 
}: ReactionDetailsModalProps) {
  const [reactionStats, setReactionStats] = useState<ReactionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedReactionType || 'all');

  useEffect(() => {
    if (isOpen) {
      fetchReactionDetails();
      if (selectedReactionType) {
        setActiveTab(selectedReactionType);
      }
    }
  }, [isOpen, postId, selectedReactionType]);

  const fetchReactionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions?include_stats=true`);
      if (response.ok) {
        const data = await response.json();
        
        // Procesar las reacciones para obtener estadísticas
        const stats: ReactionStats[] = [];
        
        if (data.reactions) {
          Object.entries(data.reactions).forEach(([type, reactionData]: [string, any]) => {
            stats.push({
              reaction_type: type,
              count: reactionData.count,
              emoji: reactionData.emoji,
              users: reactionData.users || []
            });
          });
        }
        
        setReactionStats(stats);
      }
    } catch (error) {
      console.error('Error fetching reaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    return reactionStats.reduce((total, stat) => total + stat.count, 0);
  };

  const getActiveReactionStats = () => {
    if (activeTab === 'all') {
      return reactionStats;
    }
    return reactionStats.filter(stat => stat.reaction_type === activeTab);
  };

  const formatUserName = (user: ReactionUser) => {
    return user.name || 'Usuario';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reacciones</h2>
                <p className="text-slate-400 text-sm">
                  {getTotalReactions()} reacciones totales
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Todas ({getTotalReactions()})
            </button>
            {reactionStats.map((stat) => {
              const emoji = reactionEmojis[stat.reaction_type as keyof typeof reactionEmojis];
              return (
                <button
                  key={stat.reaction_type}
                  onClick={() => setActiveTab(stat.reaction_type)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === stat.reaction_type
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  {stat.count}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {getActiveReactionStats().map((stat) => (
                  <div key={stat.reaction_type} className="space-y-3">
                    {activeTab === 'all' && (
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-700">
                        <span className="text-2xl">{stat.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-white">
                            {reactionLabels[stat.reaction_type as keyof typeof reactionLabels]}
                          </h3>
                          <p className="text-sm text-slate-400">{stat.count} reacciones</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {stat.users.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={formatUserName(user)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {formatUserName(user).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {formatUserName(user)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {formatDate(user.created_at)}
                            </p>
                          </div>
                          <span className="text-lg">
                            {stat.emoji}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {getActiveReactionStats().length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400">No hay reacciones para mostrar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
