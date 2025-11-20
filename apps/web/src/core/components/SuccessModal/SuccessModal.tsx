'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Sparkles } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  duration?: number; // Duración en milisegundos antes de cerrar automáticamente
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  duration = 4000,
}: SuccessModalProps) {
  // Cerrar automáticamente después de la duración especificada
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto relative overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Efecto de brillo animado en el fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent opacity-50" />
              
              {/* Partículas de confeti animadas */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: '50%',
                      y: '50%',
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 100}%`,
                      y: `${50 + (Math.random() - 0.5) * 100}%`,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="absolute"
                  >
                    <Sparkles className="w-4 h-4 text-green-500" />
                  </motion.div>
                ))}
              </div>

              {/* Contenido */}
              <div className="relative p-6 sm:p-8">
                {/* Botón de cerrar */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icono de éxito animado */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="relative"
                  >
                    {/* Círculo de fondo con pulso */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 bg-green-500 rounded-full"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.3,
                      }}
                      className="absolute inset-0 bg-green-500 rounded-full"
                    />
                    
                    {/* Icono principal */}
                    <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                          delay: 0.2,
                        }}
                      >
                        <CheckCircle className="w-10 h-10 text-white" fill="currentColor" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Título */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
                >
                  {title}
                </motion.h3>

                {/* Mensaje opcional */}
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-gray-600 dark:text-gray-400 mb-6"
                  >
                    {message}
                  </motion.p>
                )}

                {/* Botón de acción */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center"
                >
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
                  >
                    ¡Perfecto!
                  </motion.button>
                </motion.div>
              </div>

              {/* Barra de progreso para el cierre automático */}
              {duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className="h-1 bg-gradient-to-r from-green-500 to-emerald-600"
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

