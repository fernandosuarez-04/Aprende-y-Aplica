'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Laugh, Angry, Frown, Zap } from 'lucide-react';

interface ReactionButtonProps {
  postId: string;
  currentReaction?: string | null;
  reactionCount: number;
  onReaction: (postId: string, reaction: string | null) => void;
}

const reactions = [
  { type: '❤️', emoji: '❤️', icon: Heart, color: 'from-red-400 to-pink-500', label: 'Me encanta' },
  { type: '👍', emoji: '👍', icon: ThumbsUp, color: 'from-blue-400 to-blue-600', label: 'Me gusta' },
  { type: '😂', emoji: '😂', icon: Laugh, color: 'from-yellow-400 to-orange-500', label: 'Me divierte' },
  { type: '😮', emoji: '😮', icon: Zap, color: 'from-purple-400 to-purple-600', label: 'Me asombra' },
  { type: '😢', emoji: '😢', icon: Frown, color: 'from-gray-400 to-gray-600', label: 'Me entristece' },
  { type: '😡', emoji: '😡', icon: Angry, color: 'from-red-500 to-red-700', label: 'Me enoja' },
  { type: '🔥', emoji: '🔥', icon: Heart, color: 'from-orange-400 to-red-500', label: 'Increíble' },
  { type: '✨', emoji: '✨', icon: Heart, color: 'from-indigo-400 to-purple-500', label: 'Mágico' },
];

export function ReactionButton({ postId, currentReaction, reactionCount, onReaction }: ReactionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
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

  const handleReaction = (reactionType: string) => {
    if (currentReaction === reactionType) {
      // Si ya tiene esta reacción, quitarla
      onReaction(postId, null);
    } else {
      // Agregar nueva reacción
      onReaction(postId, reactionType);
    }
    setShowMenu(false);
  };

  const getCurrentReaction = () => {
    return reactions.find(r => r.type === currentReaction);
  };

  const currentReactionData = getCurrentReaction();

  return (
    <div className="relative" ref={buttonRef}>
      {/* Botón principal */}
      <motion.button
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setShowMenu(!showMenu)}
        className={`
          group flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 border
          ${currentReactionData 
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 text-blue-300' 
            : 'bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/30 text-slate-300 hover:text-white hover:from-slate-600/50 hover:to-slate-500/50 hover:border-slate-500/50'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {currentReactionData ? (
          <>
            <span className="text-xl group-hover:scale-110 transition-transform duration-200">
              {currentReactionData.emoji}
            </span>
            <span className="text-sm font-medium">
              {reactionCount > 0 ? reactionCount : ''}
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span className="text-lg">😊</span>
              <span className="text-lg">👍</span>
              <span className="text-lg">❤️</span>
            </div>
            <span className="text-sm font-medium">
              {reactionCount > 0 ? reactionCount : 'Reaccionar'}
            </span>
          </>
        )}
        
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      {/* Menú de reacciones */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Overlay para cerrar */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute bottom-full left-0 mb-3 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl z-50"
            >
              <div className="grid grid-cols-4 gap-2">
                {reactions.map((reaction, index) => (
                  <motion.button
                    key={reaction.type}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={() => handleReaction(reaction.type)}
                    className={`
                      relative group p-3 rounded-xl transition-all duration-300
                      ${currentReaction === reaction.type 
                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30' 
                        : 'hover:bg-slate-700/50 border border-transparent hover:border-slate-600/30'
                      }
                    `}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title={reaction.label}
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">
                      {reaction.emoji}
                    </div>
                    <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      {reaction.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Efecto de hover en el botón principal */}
      <AnimatePresence>
        {isHovering && !showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-600 rounded-2xl p-2 shadow-2xl backdrop-blur-sm z-50"
          >
            <div className="flex items-center gap-1">
              {reactions.slice(0, 3).map((reaction, index) => (
                <motion.div
                  key={reaction.type}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                >
                  {reaction.emoji}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
