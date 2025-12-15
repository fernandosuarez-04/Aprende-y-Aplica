'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Star, 
  CheckCircle2,
  Award,
  TrendingUp,
  BookOpen,
  BarChart3,
  X
} from 'lucide-react';
import { CourseWithInstructor } from '../../../features/courses/services/course.service';

interface CourseHoverPopoverProps {
  course: CourseWithInstructor;
  isVisible: boolean;
  cardRef: React.RefObject<HTMLDivElement>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

export function CourseHoverPopover({
  course,
  isVisible,
  cardRef,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: CourseHoverPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Manejar el cierre con delay
  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    // Cerrar después de un pequeño delay
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        onClose();
      }
    }, 150);
  };

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    onMouseEnter();
  };

  // Manejar clicks fuera del popover
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Agregar listener después de un pequeño delay para evitar que se cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, cardRef]);

  useEffect(() => {
    if (isVisible && cardRef.current) {
      const updatePosition = () => {
        if (!cardRef.current) return;
        
        const cardRect = cardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Ancho estimado del popover (384px = w-96)
        const popoverWidth = 384;
        const popoverHeight = 500; // Altura estimada

        // Calcular posición: a la derecha de la tarjeta por defecto
        let left = cardRect.right + 20;
        let top = cardRect.top;

        // Si no cabe a la derecha, mostrar a la izquierda
        if (left + popoverWidth > viewportWidth - 20) {
          left = cardRect.left - popoverWidth - 20;
        }

        // Ajustar verticalmente si no cabe
        if (top + popoverHeight > viewportHeight - 20) {
          top = viewportHeight - popoverHeight - 20;
        }

        // Asegurar que no se salga por arriba
        if (top < 20) {
          top = 20;
        }

        // Asegurar que no se salga por la izquierda
        if (left < 20) {
          left = 20;
        }

        setPosition({ top, left });
      };

      // Actualizar posición inmediatamente
      updatePosition();

      // Actualizar posición en caso de scroll o resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, cardRef]);

  // Formatear duración
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return 'Duración no disponible';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} ${mins} minuto${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minuto${mins > 1 ? 's' : ''}`;
    }
  };

  // Formatear nivel
  const formatLevel = (level: string | undefined) => {
    if (!level) return 'Todos los niveles';
    const levelMap: Record<string, string> = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado',
      'all': 'Todos los niveles',
    };
    return levelMap[level.toLowerCase()] || level;
  };

  // Obtener fecha de actualización
  const getUpdateDate = () => {
    if (course.updatedAt) {
      const date = new Date(course.updatedAt);
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `Actualizado ${months[date.getMonth()]} de ${date.getFullYear()}`;
    }
    return 'Recientemente actualizado';
  };

  // Truncar descripción
  const truncateDescription = (text: string | undefined, maxLength: number = 200) => {
    if (!text) return 'Sin descripción disponible.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={popoverRef}
          className="fixed z-50 w-96 bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            fontFamily: 'Inter, sans-serif'
          }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.2 
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 bg-[#E9ECEF] dark:bg-[#0F1419] hover:bg-[#6C757D]/20 dark:hover:bg-[#6C757D]/30 rounded-full transition-colors duration-200 shadow-sm"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-[#6C757D] dark:text-white/80" />
          </button>

          {/* Contenido */}
          <div className="p-5 space-y-4">
              {/* Título - Sin fondo degradado */}
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white leading-tight line-clamp-2 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {course.title}
              </h3>
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {course.status === 'Adquirido' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] dark:text-[#00D4B3] rounded-full text-xs font-semibold border border-[#00D4B3]/20">
                    <Award className="w-3.5 h-3.5" />
                    Premium
                  </span>
                )}
                {course.student_count && course.student_count > 100 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] dark:text-[#10B981] rounded-full text-xs font-semibold border border-[#10B981]/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Lo más vendido
                  </span>
                )}
              </div>

              {/* Información de actualización */}
              <p className="text-xs font-medium text-[#10B981] dark:text-[#10B981]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {getUpdateDate()}
              </p>

              {/* Estadísticas del curso */}
              <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-4 h-4 text-[#6C757D] dark:text-white/60 mb-1" />
                  <span className="text-xs font-medium text-[#0A2540] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatDuration(course.estimatedDuration)}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <BookOpen className="w-4 h-4 text-[#6C757D] dark:text-white/60 mb-1" />
                  <span className="text-xs font-medium text-[#0A2540] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatLevel(course.difficulty)}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <BarChart3 className="w-4 h-4 text-[#6C757D] dark:text-white/60 mb-1" />
                  <span className="text-xs font-medium text-[#0A2540] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Subtítulos
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <p className="text-sm text-[#6C757D] dark:text-white/80 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {truncateDescription(course.description)}
                </p>
              </div>

              {/* Objetivos de aprendizaje */}
              {course.learning_objectives && Array.isArray(course.learning_objectives) && course.learning_objectives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Lo que aprenderás:
                  </h4>
                  <ul className="space-y-2">
                    {course.learning_objectives.slice(0, 3).map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] dark:text-[#10B981] mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-[#6C757D] dark:text-white/70 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {typeof objective === 'string' ? objective : JSON.stringify(objective)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Estadísticas adicionales */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-sm font-semibold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {course.rating?.toFixed(1) || '0.0'}
                  </span>
                  {course.review_count && course.review_count > 0 && (
                    <span className="text-xs text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ({course.review_count.toLocaleString()})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                  <span className="text-xs text-[#6C757D] dark:text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {course.student_count?.toLocaleString() || 0} estudiantes
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}

