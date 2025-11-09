/**
 * 🤖 Proactive LIA Assistant Component
 * 
 * Componente que muestra intervenciones proactivas de LIA cuando
 * se detectan patrones de dificultad en la sesión del usuario.
 * 
 * Características:
 * - ✨ Animación suave de entrada
 * - 💬 Mensaje contextual de LIA
 * - ✅ Botón para aceptar ayuda
 * - ❌ Botón para dismissar
 * - 🔔 Notificación no intrusiva
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, HelpCircle, AlertCircle } from 'lucide-react';
import type { DifficultyAnalysis } from '../../lib/rrweb/difficulty-pattern-detector';

export interface ProactiveLIAAssistantProps {
  /** Análisis de dificultad detectado */
  analysis: DifficultyAnalysis | null;
  
  /** Si se debe mostrar el componente */
  show: boolean;
  
  /** Callback cuando usuario acepta ayuda */
  onAccept: () => void;
  
  /** Callback cuando usuario dismissea */
  onDismiss: () => void;
  
  /** Posición del componente (default: 'bottom-right') */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Modo compacto (más pequeño) */
  compact?: boolean;
}

export function ProactiveLIAAssistant({
  analysis,
  show,
  onAccept,
  onDismiss,
  position = 'bottom-right',
  compact = false
}: ProactiveLIAAssistantProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && analysis) {
      setIsVisible(true);
    }
  }, [show, analysis]);

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(onAccept, 300); // Esperar animación de salida
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!analysis) return null;

  // Calcular posición
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-24 right-4' // Evitar overlap con chat LIA
  };

  // Variantes de animación
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: position.includes('bottom') ? 20 : -20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  // Icono según severidad
  const getSeverityIcon = () => {
    const highSeverityPattern = analysis.patterns.find((p: any) => p.severity === 'high');
    if (highSeverityPattern) {
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
    return <HelpCircle className="w-5 h-5 text-blue-500" />;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed ${positionClasses[position]} z-50 ${compact ? 'max-w-xs' : 'max-w-md'}`}
        >
          {/* Card principal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="bg-white/20 backdrop-blur-sm rounded-full p-2"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      LIA está aquí para ayudar
                    </h3>
                    <p className="text-white/80 text-xs">
                      Asistencia inteligente
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Mensaje de LIA */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon()}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {analysis.interventionMessage}
                  </p>
                </div>
              </div>

              {/* Patrones detectados (solo si no es compacto) */}
              {!compact && analysis.patterns.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Detalles detectados:
                  </p>
                  <ul className="space-y-1">
                    {analysis.patterns.slice(0, 3).map((pattern: any, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          pattern.severity === 'high' ? 'bg-red-500' :
                          pattern.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <span>{pattern.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sí, ayúdame
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Ahora no
                </button>
              </div>
            </div>

            {/* Footer con score (solo si no es compacto) */}
            {!compact && (
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Nivel de dificultad detectado:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.overallScore * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          analysis.overallScore >= 0.7 ? 'bg-red-500' :
                          analysis.overallScore >= 0.4 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                      />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {Math.round(analysis.overallScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Indicador pulsante (opcional) */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
