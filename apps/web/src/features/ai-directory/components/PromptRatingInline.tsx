'use client';

import React, { useState, useEffect } from 'react';
import { StarRating } from '@/features/courses/components/StarRating';
import { PromptRatingService } from '../services/prompt-rating.service';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PromptRatingInlineProps {
  /**
   * Prompt slug
   */
  promptSlug: string;
  /**
   * Current average rating (for display)
   */
  currentRating: number;
  /**
   * Current rating count (for display)
   */
  currentRatingCount: number;
  /**
   * Callback when rating is successfully submitted
   */
  onRatingSubmitted?: (newRating: number, newRatingCount: number) => void;
}

export function PromptRatingInline({
  promptSlug,
  currentRating,
  currentRatingCount,
  onRatingSubmitted,
}: PromptRatingInlineProps) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayRating, setDisplayRating] = useState(currentRating);
  const [displayRatingCount, setDisplayRatingCount] = useState(currentRatingCount);

  // Sincronizar displayRating y displayRatingCount con las props cuando cambian
  useEffect(() => {
    setDisplayRating(currentRating);
    setDisplayRatingCount(currentRatingCount);
  }, [currentRating, currentRatingCount]);

  // Verificar si el usuario ya calificó
  useEffect(() => {
    async function checkRating() {
      try {
        setIsChecking(true);
        const ratingCheck = await PromptRatingService.checkUserRating(promptSlug);
        if (ratingCheck.hasRating && ratingCheck.rating) {
          setUserRating(ratingCheck.rating.rating);
        }
      } catch (err) {
        // Si hay error (ej: no autenticado), simplemente no mostrar el rating del usuario
        console.error('Error checking rating:', err);
      } finally {
        setIsChecking(false);
      }
    }

    if (promptSlug) {
      checkRating();
    }
  }, [promptSlug]);

  const handleRatingChange = async (rating: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setShowSuccess(false);

    try {
      const result = await PromptRatingService.submitRating(promptSlug, rating);
      
      // Actualizar el rating del usuario
      setUserRating(rating);
      
      // Calcular el nuevo promedio y conteo
      const wasNewRating = userRating === null;
      const newRatingCount = wasNewRating ? currentRatingCount + 1 : currentRatingCount;
      
      // Calcular nuevo promedio: (promedio_actual * conteo_actual + nuevo_rating) / nuevo_conteo
      // Si es una actualización, necesitamos recalcular: (promedio_actual * conteo_actual - rating_anterior + nuevo_rating) / conteo_actual
      let newAverageRating: number;
      if (wasNewRating) {
        // Nuevo rating: calcular promedio incluyendo el nuevo
        const totalRating = (currentRating * currentRatingCount) + rating;
        newAverageRating = totalRating / newRatingCount;
      } else {
        // Actualización: recalcular promedio restando el rating anterior y sumando el nuevo
        const totalRating = (currentRating * currentRatingCount) - userRating + rating;
        newAverageRating = totalRating / currentRatingCount;
      }
      
      // Redondear a 1 decimal
      newAverageRating = Math.round(newAverageRating * 10) / 10;
      
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Actualizar el estado local del rating promedio
      setDisplayRating(newAverageRating);
      setDisplayRatingCount(newRatingCount);
      
      // Llamar al callback para actualizar el estado del padre
      if (onRatingSubmitted) {
        onRatingSubmitted(newAverageRating, newRatingCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Rating Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {userRating !== null ? 'Tu calificación:' : 'Califica este prompt:'}
          </span>
        </div>
        <StarRating
          rating={userRating || 0}
          editable={true}
          onChange={handleRatingChange}
          size="md"
          showRatingNumber={userRating !== null}
        />
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Calificación guardada!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Current Average Rating */}
      {displayRating && displayRating > 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Calificación promedio:</span>
          <StarRating
            rating={displayRating}
            size="sm"
            showRatingNumber={true}
            reviewCount={displayRatingCount || 0}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Sin calificaciones aún
        </div>
      )}
    </div>
  );
}

