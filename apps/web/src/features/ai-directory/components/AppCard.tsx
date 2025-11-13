'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Eye, ExternalLink, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { StarRating } from '@/features/courses/components/StarRating';

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

interface AppCardProps {
  app: App;
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

export function AppCard({ app }: AppCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="group relative bg-white dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 overflow-hidden shadow-lg dark:shadow-xl h-full flex flex-col"
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Featured Badge */}
      {app.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Destacado</span>
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="mb-4">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
          style={{ 
            backgroundColor: `${app.ai_categories.color}20`,
            color: app.ai_categories.color,
            borderColor: `${app.ai_categories.color}30`
          }}
        >
          <span>{app.ai_categories.name}</span>
        </div>
      </div>

      {/* Logo and Title - Fixed height */}
      <div className="flex items-start gap-4 mb-4 flex-shrink-0" style={{ minHeight: '5rem' }}>
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {app.logo_url ? (
            <Image
              src={app.logo_url}
              alt={`${app.name} logo`}
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {app.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
            {app.name}
          </h3>
          
          {/* Pricing Badge */}
          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ${pricingColors[app.pricing_model as keyof typeof pricingColors]}`}>
            <span>{pricingLabels[app.pricing_model as keyof typeof pricingLabels]}</span>
          </div>
        </div>
      </div>

      {/* Description - Fixed height */}
      <div className="mb-4 flex-shrink-0" style={{ minHeight: '4.5rem' }}>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
          {app.description}
        </p>
      </div>

      {/* Features - Fixed height */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0" style={{ minHeight: '2rem' }}>
        {app.features.slice(0, 3).map((feature, index) => (
          <span
            key={index}
            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs"
          >
            {feature}
          </span>
        ))}
        {app.features.length > 3 && (
          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
            +{app.features.length - 3}
          </span>
        )}
      </div>

      {/* Platform Availability - Fixed height */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0" style={{ minHeight: '1.5rem' }}>
        {app.mobile_app && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span>Móvil</span>
          </div>
        )}
        {app.desktop_app && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span>Desktop</span>
          </div>
        )}
        {app.browser_extension && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span>Extensión</span>
          </div>
        )}
        {app.api_available && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span>API</span>
          </div>
        )}
      </div>

      {/* Stats - Fixed height to align ratings and views */}
      <div className="flex items-center gap-4 mb-6 text-gray-600 dark:text-gray-400 text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5 h-[14px]">
          <Eye className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs leading-none">{app.view_count.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center h-[14px]">
          {app.rating && app.rating > 0 ? (
            <div className="flex items-center h-[14px]">
              <StarRating
                rating={app.rating}
                size="sm"
                showRatingNumber={true}
                reviewCount={app.rating_count || 0}
              />
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap leading-none h-[14px] flex items-center">
              Sin calificaciones
            </span>
          )}
        </div>
      </div>

      {/* Actions - Always at the bottom */}
      <div className="flex items-center gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
        <Link href={`/apps-directory/${app.slug}`} className="w-full">
          <Button
            variant="primary"
            className="w-full group-hover:bg-blue-600 transition-colors"
          >
            Descubrir
          </Button>
        </Link>
      </div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
    </motion.div>
  );
}
