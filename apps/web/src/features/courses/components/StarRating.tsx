'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export interface StarRatingProps {
  /**
   * Rating value (0-5)
   */
  rating: number;
  /**
   * Size of the stars
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the rating is editable
   */
  editable?: boolean;
  /**
   * Callback when rating changes (only in editable mode)
   */
  onChange?: (rating: number) => void;
  /**
   * Show rating number next to stars
   */
  showRatingNumber?: boolean;
  /**
   * Show review count
   */
  reviewCount?: number;
  /**
   * Additional className
   */
  className?: string;
}

const sizeMap = {
  sm: { star: 12, gap: 2 },
  md: { star: 16, gap: 4 },
  lg: { star: 24, gap: 6 },
};

export function StarRating({
  rating,
  size = 'md',
  editable = false,
  onChange,
  showRatingNumber = false,
  reviewCount,
  className = '',
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const { star: starSize, gap } = sizeMap[size];
  const displayRating = isHovering && hoveredRating !== null ? hoveredRating : rating;

  const handleStarClick = (value: number) => {
    if (editable && onChange) {
      onChange(value);
    }
  };

  const handleStarHover = (value: number) => {
    if (editable) {
      setHoveredRating(value);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setIsHovering(false);
      setHoveredRating(null);
    }
  };

  return (
    <div className={`flex items-center ${className}`} style={{ gap: `${gap}px` }}>
      <div
        className="flex items-center"
        style={{ gap: `${gap}px` }}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= Math.floor(displayRating);
          const isHalfFilled = value - 0.5 <= displayRating && displayRating < value;
          const isActive = editable && (hoveredRating !== null ? value <= hoveredRating : value <= rating);

          return (
            <motion.button
              key={value}
              type="button"
              disabled={!editable}
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => handleStarHover(value)}
              className={`
                ${editable ? 'cursor-pointer' : 'cursor-default'}
                transition-all duration-200
                ${isActive ? 'scale-110' : 'scale-100'}
              `}
              whileHover={editable ? { scale: 1.2 } : {}}
              whileTap={editable ? { scale: 0.9 } : {}}
              style={{ width: `${starSize}px`, height: `${starSize}px` }}
            >
              <Star
                size={starSize}
                className={`
                  transition-colors duration-200
                  ${
                    isFilled || isHalfFilled
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-carbon-600 fill-transparent'
                  }
                  ${editable && isActive ? 'drop-shadow-lg' : ''}
                `}
                style={{
                  filter: editable && isActive ? 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' : 'none',
                }}
              />
            </motion.button>
          );
        })}
      </div>

      {showRatingNumber && (
        <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}

      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-xs text-gray-600 dark:text-carbon-200 ml-1">
          ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
        </span>
      )}
    </div>
  );
}

