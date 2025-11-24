'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Eye, ExternalLink, CheckCircle, XCircle, Sparkles, Globe, Smartphone, Monitor, Puzzle, Code } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@aprende-y-aplica/ui';
import { LoadingSpinner } from '../../../features/ai-directory/components/LoadingSpinner';
import { StarRating } from '../../../features/courses/components/StarRating';
import { AppRatingInline } from '../../../features/ai-directory/components/AppRatingInline';

interface App {
  app_id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  category_id: string;
  website_url: string;
  logo_url: string;
  pricing_model: string;
  pricing_details: any;
  features: string[];
  use_cases: string[];
  advantages: string[];
  disadvantages: string[];
  alternatives: string[];
  tags: string[];
  supported_languages: string[];
  integrations: string[];
  api_available: boolean;
  mobile_app: boolean;
  desktop_app: boolean;
  browser_extension: boolean;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  like_count: number;
  rating?: number | null;
  rating_count?: number | null;
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

const pricingColors = {
  free: 'bg-green-500/20 text-green-400 border-green-500/30',
  freemium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-red-500/20 text-red-400 border-red-500/30',
  subscription: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

const pricingLabels = {
  free: 'Gratuito',
  freemium: 'Freemium',
  paid: 'De Pago',
  subscription: 'Suscripción'
};

export default function AppDetailPage() {
  const params = useParams();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApp = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-directory/apps/${params.slug}`);
      
      if (!response.ok) {
        throw new Error('App not found');
      }

      const data = await response.json();
      setApp(data.app);
      setError(null);

      // Incrementar contador de visualizaciones
      try {
        await fetch(`/api/ai-directory/apps/${params.slug}/view`, {
          method: 'POST',
        });
      } catch (viewError) {
        // No fallar si el incremento de vistas falla
        console.error('Error incrementing view count:', viewError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.slug) {
      fetchApp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Herramienta no encontrada</h1>
          <Link href="/apps-directory">
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/apps-directory">
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
            {/* App Info */}
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {app.logo_url ? (
                  <Image
                    src={app.logo_url}
                    alt={`${app.name} logo`}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {app.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border"
                    style={{ 
                      backgroundColor: `${app.ai_categories.color}20`,
                      color: app.ai_categories.color,
                      borderColor: `${app.ai_categories.color}30`
                    }}
                  >
                    <span>{app.ai_categories.name}</span>
                  </div>
                  
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${pricingColors[app.pricing_model as keyof typeof pricingColors]}`}>
                    <span>{pricingLabels[app.pricing_model as keyof typeof pricingLabels]}</span>
                  </div>
                  
                  {app.is_featured && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Destacado</span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  {app.name}
                </h1>
                
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {app.description}
                </p>
                
                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{app.view_count.toLocaleString()} visualizaciones</span>
                  </div>
                  
                  {app.rating && app.rating > 0 ? (
                    <div className="flex items-center gap-2">
                      <StarRating
                        rating={app.rating}
                        size="sm"
                        showRatingNumber={true}
                        reviewCount={app.rating_count || 0}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Sin calificaciones
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {app.website_url && (
                <motion.a
                  href={app.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Visitar Sitio Web
                </motion.a>
              )}
            </div>
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
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {app.long_description && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Descripción</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{app.long_description}</p>
                </div>
              )}

              {/* Features */}
              {app.features && app.features.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Características Principales</h2>
                  <ul className="space-y-3">
                    {app.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Use Cases */}
              {app.use_cases && app.use_cases.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Casos de Uso</h2>
                  <ul className="space-y-3">
                    {app.use_cases.map((useCase, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advantages and Disadvantages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Advantages */}
                {app.advantages && app.advantages.length > 0 && (
                  <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ventajas</h3>
                    <ul className="space-y-3">
                      {app.advantages.map((advantage, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disadvantages */}
                {app.disadvantages && app.disadvantages.length > 0 && (
                  <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Desventajas</h3>
                    <ul className="space-y-3">
                      {app.disadvantages.map((disadvantage, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{disadvantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Alternatives */}
              {app.alternatives && app.alternatives.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Alternativas</h2>
                  <div className="flex flex-wrap gap-2">
                    {app.alternatives.map((alternative, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                      >
                        {alternative}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Platform Availability */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Disponibilidad</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Web</span>
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                  </div>
                  
                  {app.mobile_app && (
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Móvil</span>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                    </div>
                  )}
                  
                  {app.desktop_app && (
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Desktop</span>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                    </div>
                  )}
                  
                  {app.browser_extension && (
                    <div className="flex items-center gap-3">
                      <Puzzle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Extensión</span>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                    </div>
                  )}
                  
                  {app.api_available && (
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">API</span>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rating Section */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calificación</h3>
                <AppRatingInline
                  appSlug={app.slug}
                  currentRating={app.rating || 0}
                  currentRatingCount={app.rating_count || 0}
                  onRatingSubmitted={async (newRating, newRatingCount) => {
                    // Actualizar solo los datos de rating sin recargar toda la página
                    if (app) {
                      setApp({
                        ...app,
                        rating: newRating,
                        rating_count: newRatingCount,
                      });
                    }
                  }}
                />
              </div>

              {/* Supported Languages */}
              {app.supported_languages && app.supported_languages.length > 0 && (
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Idiomas Soportados</h3>
                  <div className="flex flex-wrap gap-2">
                    {app.supported_languages.map((language, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg dark:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Visualizaciones</span>
                    <span className="text-gray-900 dark:text-white font-medium">{app.view_count.toLocaleString()}</span>
                  </div>
                  {app.rating && app.rating > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Calificación</span>
                        <StarRating
                          rating={app.rating}
                          size="sm"
                          showRatingNumber={true}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reseñas</span>
                        <span className="text-gray-900 dark:text-white font-medium">{app.rating_count || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Sin calificaciones aún
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
