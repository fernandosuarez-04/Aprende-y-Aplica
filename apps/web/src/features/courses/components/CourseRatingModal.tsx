'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { CourseRatingService } from '../services/course-rating.service';

export interface CourseRatingModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Course slug
   */
  courseSlug: string;
  /**
   * Course title (for display)
   */
  courseTitle?: string;
  /**
   * Callback when rating is successfully submitted
   */
  onRatingSubmitted?: () => void;
}

export function CourseRatingModal({
  isOpen,
  onClose,
  courseSlug,
  courseTitle,
  onRatingSubmitted,
}: CourseRatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewContent, setReviewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await CourseRatingService.submitRating(
        courseSlug,
        rating,
        reviewTitle.trim() || undefined,
        reviewContent.trim() || undefined
      );

      // Reset form
      setRating(0);
      setReviewTitle('');
      setReviewContent('');

      // Call success callback
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      // Close modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setRating(0);
      setReviewTitle('');
      setReviewContent('');
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <Star className="w-10 h-10 text-white fill-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                Califica este curso
              </h3>
              {courseTitle && (
                <p className="text-slate-400 text-center text-sm">
                  {courseTitle}
                </p>
              )}
            </div>

            {/* Rating Stars */}
            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-medium mb-3 text-center">
                ¿Cómo calificarías este curso?
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  editable={true}
                  onChange={setRating}
                  size="lg"
                />
              </div>
            </div>

            {/* Review Title (Optional) */}
            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Título de tu reseña (opcional)
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Ej: Excelente curso"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={100}
              />
            </div>

            {/* Review Content (Optional) */}
            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Comparte tu experiencia con este curso..."
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {reviewContent.length}/1000
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Enviar calificación</span>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

