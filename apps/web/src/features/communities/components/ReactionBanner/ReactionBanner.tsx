'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ReactionBannerProps {
  totalReactions: number;
  topReactions?: Array<{
    reaction_type: string;
    count: number;
    emoji: string;
  }>;
  className?: string;
  showTopReactions?: boolean;
}

export function ReactionBanner({ 
  totalReactions, 
  topReactions = [], 
  className = '',
  showTopReactions = true
}: ReactionBannerProps) {
  if (totalReactions === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
    >
      {/* Contador total de reacciones */}
      <span className="font-medium">
        {totalReactions} {totalReactions === 1 ? 'reacción' : 'reacciones'}
      </span>

      {/* Separador */}
      {showTopReactions && topReactions.length > 0 && (
        <span className="text-gray-400">•</span>
      )}

      {/* Top reacciones (máximo 3) */}
      {showTopReactions && (
        <div className="flex items-center space-x-1">
          {topReactions.slice(0, 3).map((reaction, index) => (
          <motion.div
            key={reaction.reaction_type}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            className="flex items-center space-x-1"
          >
            <span className="text-lg" role="img" aria-label={reaction.reaction_type}>
              {reaction.emoji}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {reaction.count}
            </span>
          </motion.div>
        ))}
        </div>
      )}
    </motion.div>
  );
}