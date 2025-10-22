'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Laugh, Angry, Sad, Surprised } from 'lucide-react';

interface ReactionButtonProps {
  postId: string;
  currentReaction?: string | null;
  reactionCount: number;
  onReaction: (postId: string, reaction: string | null) => void;
}

const reactions = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { type: 'love', emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { type: 'laugh', emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', icon: Surprised, color: 'text-purple-500' },
  { type: 'sad', emoji: '😢', icon: Sad, color: 'text-blue-400' },
  { type: 'angry', emoji: '😡', icon: Angry, color: 'text-red-600' },
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
          flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200
          ${currentReactionData 
            ? `${currentReactionData.color} bg-opacity-10` 
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {currentReactionData ? (
          <>
            <span className="text-lg">{currentReactionData.emoji}</span>
            <span className="text-sm font-medium">
              {reactionCount > 0 ? reactionCount : ''}
            </span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" />
            <span className="text-sm">
              {reactionCount > 0 ? reactionCount : 'Reaccionar'}
            </span>
          </>
        )}
      </motion.button>

      {/* Menú de reacciones */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-600 rounded-2xl p-2 shadow-2xl backdrop-blur-sm z-50"
          >
            <div className="flex items-center gap-1">
              {reactions.map((reaction, index) => (
                <motion.button
                  key={reaction.type}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => handleReaction(reaction.type)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-xl
                    transition-all duration-200 hover:scale-125
                    ${currentReaction === reaction.type 
                      ? 'bg-slate-700 scale-110' 
                      : 'hover:bg-slate-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {reaction.emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
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
