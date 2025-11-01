'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Star, Eye, Download, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';

interface Prompt {
  prompt_id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  tags: string[];
  difficulty_level: string;
  estimated_time_minutes: number;
  use_cases: string[];
  tips: string[];
  author_id?: string;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  like_count: number;
  download_count: number;
  rating: number;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ai_categories: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface PromptCardProps {
  prompt: Prompt;
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const difficultyLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado'
};

export function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="group relative bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 overflow-hidden shadow-lg dark:shadow-xl"
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Featured Badge */}
      {prompt.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">Destacado</span>
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="mb-4">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
          style={{ 
            backgroundColor: `${prompt.ai_categories.color}20`,
            color: prompt.ai_categories.color,
            borderColor: `${prompt.ai_categories.color}30`
          }}
        >
          <span>{prompt.ai_categories.name}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
        {prompt.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
        {prompt.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {prompt.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs"
          >
            {tag}
          </span>
        ))}
        {prompt.tags.length > 3 && (
          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
            +{prompt.tags.length - 3}
          </span>
        )}
      </div>

      {/* Difficulty and Time */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${difficultyColors[prompt.difficulty_level as keyof typeof difficultyColors]}`}>
          <span>{difficultyLabels[prompt.difficulty_level as keyof typeof difficultyLabels]}</span>
        </div>
        
        {prompt.estimated_time_minutes && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
            <Clock className="w-3 h-3" />
            <span>{prompt.estimated_time_minutes} min</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-gray-600 dark:text-gray-400 text-xs">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{prompt.view_count.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{prompt.rating.toFixed(1)} ({prompt.rating_count})</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          <span>{prompt.download_count}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href={`/prompt-directory/${prompt.slug}`} className="flex-1">
          <Button 
            variant="primary" 
            className="w-full group-hover:bg-purple-600 transition-colors"
          >
            Ver Detalles
          </Button>
        </Link>
        
        <motion.button
          onClick={handleCopyPrompt}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
    </motion.div>
  );
}
