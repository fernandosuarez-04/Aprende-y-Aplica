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
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLongPressedRef = useRef(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú al hacer click fuera (solo en móvil)
  useEffect(() => {
    if (!isMobile) return; // No usar en desktop, el hover maneja todo
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && 
        menuRef.current &&
        !buttonRef.current.contains(target) &&
        !menuRef.current.contains(target)
      ) {
        setShowMenu(false);
        hasLongPressedRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile]);

  // Manejar hover con delay para evitar cierre accidental
  const handleMouseEnter = () => {
    if (!isMobile) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovering(true);
      setShowMenu(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
      // Delay más largo para permitir mover el cursor al menú
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringMenu) {
          setShowMenu(false);
        }
      }, 300); // Aumentado a 300ms para dar más tiempo
    }
  };

  const handleMenuMouseEnter = () => {
    if (!isMobile) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHoveringMenu(true);
    }
  };

  const handleMenuMouseLeave = () => {
    if (!isMobile) {
      setIsHoveringMenu(false);
      // Delay antes de cerrar el menú
      hoverTimeoutRef.current = setTimeout(() => {
        setShowMenu(false);
      }, 200);
    }
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
    hasLongPressedRef.current = false;
  };

  // Handlers para móvil: long press para abrir menú
  const handleTouchStart = (e: React.TouchEvent) => {
    // Verificar si es móvil o dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || window.innerWidth < 768;
    if (!isTouchDevice) return;
    
    hasLongPressedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      hasLongPressedRef.current = true;
      setShowMenu(true);
    }, 500); // 500ms para long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Verificar si es móvil o dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || window.innerWidth < 768;
    if (!isTouchDevice) return;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Si fue un long press, no hacer nada (el menú ya está abierto)
    if (hasLongPressedRef.current) {
      return;
    }

    // Si no fue un long press, el onClick se encargará de ejecutar el like
  };

  const handleTouchCancel = () => {
    // Verificar si es móvil o dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || window.innerWidth < 768;
    if (!isTouchDevice) return;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    hasLongPressedRef.current = false;
  };

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
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
          onMouseEnter={!isMobile ? handleMouseEnter : undefined}
          onMouseLeave={!isMobile ? handleMouseLeave : undefined}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onClick={(e) => {
            // Verificar si es móvil o dispositivo táctil
            const isTouchDevice = 'ontouchstart' in window || window.innerWidth < 768;
            
            // En desktop, el click solo debe ejecutarse si no hay hover activo
            if (!isTouchDevice && !isMobile) {
              // Si el menú está abierto por hover, no hacer nada con el click
              // Solo aplicar la reacción si no hay hover
              if (!isHovering && !isHoveringMenu) {
                // Si ya tiene una reacción, quitarla al hacer click
                if (currentReaction) {
                  onReaction(postId, currentReaction);
                } else {
                  // Si no tiene reacción, agregar "Me gusta"
                  onReaction(postId, 'like');
                }
              }
              return;
            }
            
            // En móvil, prevenir el click si fue un long press
            if (isTouchDevice && hasLongPressedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              hasLongPressedRef.current = false; // Resetear para el próximo click
              return;
            }
            
            // En móvil, click normal (sin long press)
            if (isTouchDevice && !hasLongPressedRef.current) {
              // Pequeño delay para asegurar que el touchEnd se procese primero
              setTimeout(() => {
                if (!hasLongPressedRef.current) {
                  // Si ya tiene una reacción, quitarla al hacer click
                  if (currentReaction) {
                    onReaction(postId, currentReaction);
                  } else {
                    // Si no tiene reacción, agregar "Me gusta"
                    onReaction(postId, 'like');
                  }
                }
              }, 50);
            }
          }}
          className={`
            flex items-center gap-1 sm:gap-1.5 transition-colors py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30
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
                return <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
              })()}
              <span className="text-xs sm:text-sm">{currentReactionData.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Me gusta</span>
            </>
          )}
        </motion.button>

        {/* Menú de reacciones para Facebook style */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Overlay para cerrar el menú - solo en móvil */}
              {isMobile && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => {
                    setShowMenu(false);
                    hasLongPressedRef.current = false;
                  }}
                  onTouchStart={(e) => {
                    // Solo cerrar si el touch no es en el menú
                    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                      setShowMenu(false);
                      hasLongPressedRef.current = false;
                    }
                  }}
                />
              )}
              {/* Área invisible para conectar el botón con el menú en desktop */}
              {!isMobile && (
                <div 
                  className="absolute bottom-full left-0 w-full h-2 pointer-events-auto"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={() => {
                    setIsHoveringMenu(false);
                    hoverTimeoutRef.current = setTimeout(() => {
                      if (!isHovering) {
                        setShowMenu(false);
                      }
                    }, 200);
                  }}
                  style={{ zIndex: 49 }}
                />
              )}
              <motion.div
                ref={menuRef}
                onMouseEnter={!isMobile ? handleMenuMouseEnter : undefined}
                onMouseLeave={!isMobile ? handleMenuMouseLeave : undefined}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute bottom-full left-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-600/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3 shadow-2xl z-50"
                style={{ 
                  maxWidth: isMobile ? 'calc(100vw - 1rem)' : 'none',
                  left: isMobile ? '50%' : '0',
                  transform: isMobile ? 'translateX(-50%)' : 'none',
                  marginBottom: isMobile ? '0.5rem' : '0.25rem' // Gap más pequeño en desktop
                }}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-nowrap">
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
                          relative group p-1.5 sm:p-2 md:p-2.5 rounded-full transition-all duration-300 flex-shrink-0
                          ${isCurrentReaction 
                            ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 dark:border-blue-400/30' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-gray-300 dark:hover:border-slate-600/30'
                          }
                        `}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        title={isCurrentReaction ? `Quitar ${reaction.label}` : reaction.label}
                      >
                        <IconComponent 
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform duration-200 ${
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
                            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-blue-400 rounded-full border-2 border-white dark:border-slate-800"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
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
