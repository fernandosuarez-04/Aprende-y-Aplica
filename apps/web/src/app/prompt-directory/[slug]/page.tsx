'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, Check, Star, Eye, Download, Clock, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { LoadingSpinner } from '../../../features/ai-directory/components/LoadingSpinner';

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

export default function PromptDetailPage() {
  const params = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ai-directory/prompts/${params.slug}`);
        
        if (!response.ok) {
          throw new Error('Prompt not found');
        }

        const data = await response.json();
        setPrompt(data.prompt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchPrompt();
    }
  }, [params.slug]);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Prompt no encontrado</h1>
          <Link href="/prompt-directory">
            <Button variant="primary">Volver al Directorio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <motion.div
        className="relative pt-24 pb-8 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 dark:opacity-100 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/prompt-directory">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Directorio
              </Button>
            </Link>
          </motion.div>

          {/* Header Content */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Category and Featured Badge */}
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border"
                style={{ 
                  backgroundColor: `${prompt.ai_categories.color}20`,
                  color: prompt.ai_categories.color,
                  borderColor: `${prompt.ai_categories.color}30`
                }}
              >
                <span>{prompt.ai_categories.name}</span>
              </div>
              
              {prompt.is_featured && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Destacado</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {prompt.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              {prompt.description}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium ${difficultyColors[prompt.difficulty_level as keyof typeof difficultyColors]}`}>
                <span>{difficultyLabels[prompt.difficulty_level as keyof typeof difficultyLabels]}</span>
              </div>
              
              {prompt.estimated_time_minutes && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{prompt.estimated_time_minutes} minutos</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                <span>{prompt.view_count.toLocaleString()} visualizaciones</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4" />
                <span>{prompt.rating.toFixed(1)} ({prompt.rating_count} reseñas)</span>
              </div>
            </div>

            {/* Copy Button */}
            <motion.button
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Prompt
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="container mx-auto px-4 pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Prompt Content */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contenido del Prompt</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {prompt.content}
                  </pre>
                </div>
              </div>

              {/* Use Cases */}
              {prompt.use_cases && prompt.use_cases.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Casos de Uso</h2>
                  <ul className="space-y-3">
                    {prompt.use_cases.map((useCase, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {prompt.tips && prompt.tips.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Consejos de Uso</h2>
                  <ul className="space-y-3">
                    {prompt.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tags */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Visualizaciones</span>
                    <span className="text-gray-900 dark:text-white font-medium">{prompt.view_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Descargas</span>
                    <span className="text-gray-900 dark:text-white font-medium">{prompt.download_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Calificación</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-gray-900 dark:text-white font-medium">{prompt.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reseñas</span>
                    <span className="text-gray-900 dark:text-white font-medium">{prompt.rating_count}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones</h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleCopyPrompt}
                    variant="primary"
                    className="w-full"
                  >
                    {copied ? '¡Copiado!' : 'Copiar Prompt'}
                  </Button>
                  
                  <Button variant="ghost" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
