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

export interface OrganizationColors {
  primary?: string;
  accent?: string;
  cardBg?: string;
  textColor?: string;
}

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

  /** Colores personalizados de la organización */
  colors?: OrganizationColors;
}

export function ProactiveLIAAssistant({
  analysis,
  show,
  onAccept,
  onDismiss,
  position = 'bottom-right',
  compact = false,
  colors
}: ProactiveLIAAssistantProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Colores con fallback a colores SOFIA por defecto (Modo Oscuro)
  const themeColors = {
    primary: colors?.primary || '#00D4B3',
    accent: colors?.accent || '#00D4B3',
    cardBg: colors?.cardBg || '#1E2329', // Fondo Dark por defecto
    text: colors?.textColor || '#FFFFFF', // Texto White por defecto
  };

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
      return <AlertCircle className="w-5 h-5" style={{ color: '#F59E0B' }} />; // Ámbar suave
    }
    return <HelpCircle className="w-5 h-5" style={{ color: themeColors.primary }} />;
  };

  // Color de la barra de progreso según el score
  const getProgressColor = () => {
    if (analysis.overallScore >= 0.7) {
      return '#F59E0B'; // Ámbar para alta dificultad
    } else if (analysis.overallScore >= 0.4) {
      return themeColors.accent; // Aqua para dificultad media
    }
    return '#10B981'; // Verde suave para baja dificultad
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
          <div
            className="rounded-xl shadow-lg border overflow-hidden"
            style={{
              backgroundColor: themeColors.cardBg,
              borderColor: `${themeColors.primary}20`
            }}
          >
            {/* Header minimalista */}
            <div
              className="px-4 py-3"
              style={{ backgroundColor: themeColors.primary }}
            >
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
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: themeColors.text }}
                  >
                    {analysis.interventionMessage}
                  </p>
                </div>
              </div>

              {/* Botones de acción - estilo SOFIA */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAccept}
                  className="flex-1 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  style={{ backgroundColor: themeColors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Sí, ayúdame
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 font-medium rounded-lg border transition-all duration-200"
                  style={{
                    color: themeColors.primary,
                    borderColor: `${themeColors.primary}20`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.primary}05`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Ahora no
                </button>
              </div>
            </div>

            {/* Footer con score - diseño minimalista */}
            {!compact && (
              <div
                className="px-4 py-2.5 border-t"
                style={{
                  backgroundColor: themeColors.cardBg,
                  borderColor: `${themeColors.primary}20`
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: `${themeColors.text}80` }}>
                    Nivel de dificultad detectado:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.text}10` }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.overallScore * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getProgressColor() }}
                      />
                    </div>
                    <span className="font-medium min-w-[2.5rem] text-right" style={{ color: themeColors.primary }}>
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
