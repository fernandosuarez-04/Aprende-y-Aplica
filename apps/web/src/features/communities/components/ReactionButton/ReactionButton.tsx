'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Laugh, Angry, Frown } from 'lucide-react';

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
    {/* Círculo de la cara */}
    <circle cx="12" cy="12" r="10" />
    {/* Ojos sorprendidos (puntos) */}
    <circle cx="8" cy="9" r="0.4" fill="currentColor" />
    <circle cx="16" cy="9" r="0.4" fill="currentColor" />
    {/* Boca abierta en forma de "o" (sin relleno) */}
    <circle cx="12" cy="15" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface ReactionButtonProps {
  postId: string;
  currentReaction?: string | null;
  reactionCount: number;
  onReaction: (postId: string, reaction: string | null) => void;
  isFacebookStyle?: boolean;
}

const reactions = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, color: 'from-blue-400 to-blue-600', label: 'Me gusta' },
  { type: 'love', emoji: '❤️', icon: Heart, color: 'from-red-400 to-pink-500', label: 'Me encanta' },
  { type: 'laugh', emoji: '😂', icon: Laugh, color: 'from-yellow-400 to-orange-500', label: 'Me divierte' },
  { type: 'wow', emoji: '😮', icon: SurprisedFace, color: 'from-purple-400 to-purple-600', label: 'Me asombra' },
  { type: 'sad', emoji: '😢', icon: Frown, color: 'from-gray-400 to-gray-600', label: 'Me entristece' },
  { type: 'angry', emoji: '😡', icon: Angry, color: 'from-red-500 to-red-700', label: 'Me enoja' },
];

export function ReactionButton({ postId, currentReaction, reactionCount, onReaction, isFacebookStyle = false }: ReactionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringMenu, setIsHoveringMenu] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Manejar hover con delay para evitar cierre accidental
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(true);
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringMenu) {
        setShowMenu(false);
      }
    }, 150); // Pequeño delay para permitir mover el cursor al menú
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHoveringMenu(true);
  };

  const handleMenuMouseLeave = () => {
    setIsHoveringMenu(false);
    setShowMenu(false);
  };

  const handleReaction = (reactionType: string) => {
    if (currentReaction === reactionType) {
      // Si ya tiene esta reacción, quitarla enviando el tipo actual
      onReaction(postId, reactionType);
    } else {
      // Agregar nueva reacción
      onReaction(postId, reactionType);
    }
    setShowMenu(false);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const getCurrentReaction = () => {
    return reactions.find(r => r.type === currentReaction);
  };

  const currentReactionData = getCurrentReaction();

  // Estilo de Facebook
  if (isFacebookStyle) {
    return (
      <div className="relative" ref={buttonRef}>
        <motion.button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            // Si ya tiene una reacción, quitarla al hacer click
            if (currentReaction) {
              onReaction(postId, currentReaction);
            } else {
              // Si no tiene reacción, agregar "Me gusta"
              onReaction(postId, 'like');
            }
          }}
          className={`
            flex items-center gap-2 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30
            ${currentReactionData 
              ? currentReactionData.type === 'like' ? 'text-blue-600 dark:text-blue-400' :
                currentReactionData.type === 'love' ? 'text-red-600 dark:text-red-400' :
                currentReactionData.type === 'laugh' ? 'text-yellow-600 dark:text-yellow-400' :
                currentReactionData.type === 'wow' ? 'text-purple-600 dark:text-purple-400' :
                currentReactionData.type === 'sad' ? 'text-gray-600 dark:text-gray-400' :
                currentReactionData.type === 'angry' ? 'text-red-700 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentReactionData ? (
            <>
              {(() => {
                const IconComponent = currentReactionData.icon;
                return <IconComponent className="w-5 h-5" />;
              })()}
              <span>{currentReactionData.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp className="w-5 h-5" />
              <span>Me gusta</span>
            </>
          )}
        </motion.button>

        {/* Menú de reacciones para Facebook style */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              ref={menuRef}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute bottom-full left-0 mb-3 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-600/50 rounded-2xl p-4 shadow-2xl z-50"
            >
              <div className="flex items-center gap-2">
                {reactions.map((reaction, index) => {
                  const IconComponent = reaction.icon;
                  const isCurrentReaction = currentReaction === reaction.type;
                  
                  return (
                    <motion.button
                      key={reaction.type}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => handleReaction(reaction.type)}
                      className={`
                        relative group p-3 rounded-full transition-all duration-300
                        ${isCurrentReaction 
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 dark:border-blue-400/30' 
                          : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-gray-300 dark:hover:border-slate-600/30'
                        }
                      `}
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      title={isCurrentReaction ? `Quitar ${reaction.label}` : reaction.label}
                    >
                      <IconComponent 
                        className={`w-6 h-6 group-hover:scale-110 transition-transform duration-200 ${
                          reaction.type === 'like' ? 'text-blue-400' :
                          reaction.type === 'love' ? 'text-red-400' :
                          reaction.type === 'laugh' ? 'text-yellow-400' :
                          reaction.type === 'wow' ? 'text-purple-400' :
                          reaction.type === 'sad' ? 'text-gray-400' :
                          reaction.type === 'angry' ? 'text-red-500' : 'text-slate-400'
                        }`}
                      />
                      
                      {/* Indicador visual para la reacción actual */}
                      {isCurrentReaction && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white dark:border-slate-800"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

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
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 dark:border-blue-400/30 text-blue-700 dark:text-blue-300' 
            : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700/50 dark:to-slate-600/50 border-gray-300 dark:border-slate-600/30 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:from-gray-200 dark:hover:from-slate-600/50 hover:to-gray-300 dark:hover:to-slate-500/50 hover:border-gray-400 dark:hover:border-slate-500/50'
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
              className="absolute bottom-full left-0 mb-3 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-600/50 rounded-2xl p-4 shadow-2xl z-50"
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
                    <div className="text-xs text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-300 transition-colors">
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
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-2 shadow-2xl backdrop-blur-sm z-50"
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
