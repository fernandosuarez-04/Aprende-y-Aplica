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

  // Icono según severidad - usando colores del sistema SOFIA
  const getSeverityIcon = () => {
    const highSeverityPattern = analysis.patterns.find((p: any) => p.severity === 'high');
    if (highSeverityPattern) {
      return <AlertCircle className="w-5 h-5 text-[#F59E0B]" />; // Ámbar suave
    }
    return <HelpCircle className="w-5 h-5 text-[#0A2540]" />; // Azul Profundo
  };

  // Color de la barra de progreso según el score
  const getProgressColor = () => {
    if (analysis.overallScore >= 0.7) {
      return 'bg-[#F59E0B]'; // Ámbar para alta dificultad
    } else if (analysis.overallScore >= 0.4) {
      return 'bg-[#00D4B3]'; // Aqua para dificultad media
    }
    return 'bg-[#10B981]'; // Verde suave para baja dificultad
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
          {/* Card principal - diseño minimalista */}
          <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden">
            {/* Header minimalista con color Azul Profundo */}
            <div className="bg-[#0A2540] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="bg-white/20 rounded-full p-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white text-base leading-tight">
                      LIA está aquí para ayudar
                    </h3>
                    <p className="text-white/90 text-xs font-normal">
                      Asistencia inteligente
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body - diseño limpio */}
            <div className="p-4 space-y-3">
              {/* Mensaje de LIA */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon()}
                </div>
                <div className="flex-1">
                  <p className="text-[#0A2540] dark:text-gray-200 text-sm leading-relaxed">
                    {analysis.interventionMessage}
                  </p>
                </div>
              </div>

              {/* Botones de acción - estilo SOFIA */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Sí, ayúdame
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-[#0A2540] dark:text-gray-300 hover:text-[#0A2540] dark:hover:text-white font-medium rounded-lg border border-[#0A2540]/20 dark:border-[#6C757D]/50 hover:bg-[#0A2540]/5 dark:hover:bg-[#6C757D]/10 transition-all duration-200"
                >
                  Ahora no
                </button>
              </div>
            </div>

            {/* Footer con score - diseño minimalista */}
            {!compact && (
              <div className="bg-white dark:bg-[#1E2329] px-4 py-2.5 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6C757D] dark:text-gray-400 font-normal">
                    Nivel de dificultad detectado:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-[#0F1419] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.overallScore * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${getProgressColor()}`}
                      />
                    </div>
                    <span className="font-medium text-[#0A2540] dark:text-gray-300 min-w-[2.5rem] text-right">
                      {Math.round(analysis.overallScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
