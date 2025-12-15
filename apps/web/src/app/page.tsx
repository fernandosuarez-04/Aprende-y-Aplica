'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentService } from '../core/services/contentService';
import { LandingPageContent } from '@aprende-y-aplica/shared';
import { HeroSection } from '../features/landing/components/HeroSection';
import { FeaturesSection } from '../features/landing/components/FeaturesSection';
import { StatisticsSection } from '../features/landing/components/StatisticsSection';
import { TestimonialsSection } from '../features/landing/components/TestimonialsSection';
import { PWAPrompt } from '../core/components/PWAPrompt';
import { CTASection } from '../features/landing/components/CTASection';

export default function HomePage() {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        const result = await ContentService.getLandingPageContent();
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setContent(result.data);
        }
      } catch (err) {
        setError('Error al cargar el contenido');
        // console.error('Error loading content:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
            style={{
              background: 'radial-gradient(circle, var(--color-primary, rgb(59, 130, 246)), transparent)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
            style={{
              background: 'radial-gradient(circle, var(--color-secondary, rgb(139, 92, 246)), transparent)',
            }}
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />

          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Loading Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Premium Spinner */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            {/* Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-transparent"
              style={{
                borderTopColor: 'var(--color-primary, rgb(59, 130, 246))',
                borderRightColor: 'var(--color-secondary, rgb(139, 92, 246))',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Middle Ring */}
            <motion.div
              className="absolute inset-2 sm:inset-3 rounded-full border-[3px] border-transparent"
              style={{
                borderBottomColor: 'var(--color-primary, rgb(59, 130, 246))',
                borderLeftColor: 'var(--color-secondary, rgb(139, 92, 246))',
              }}
              animate={{ rotate: -360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Inner Pulsing Circle */}
            <motion.div
              className="absolute inset-4 sm:inset-6 rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Center Dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-lg"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>

            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Loading Text */}
          <div className="flex flex-col items-center gap-4">
            <motion.p
              className="text-[var(--color-contrast)]/90 text-lg sm:text-xl font-medium tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Cargando...
            </motion.p>
            
            {/* Animated Dots */}
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-primary, rgb(59, 130, 246))',
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Progress Indicator */}
          <motion.div
            className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                className="h-full w-1/3 rounded-full absolute top-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
                }}
                animate={{
                  x: ['-100%', '400%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>

      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-contrast)] mb-4 transition-colors duration-300">Error</h1>
          <p className="text-[var(--color-contrast)]/70 mb-8 transition-colors duration-300">{error || 'No se pudo cargar el contenido'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Hero Section */}
      <HeroSection content={content.hero} />
      
      {/* Features Section */}
      <FeaturesSection 
        title={content.features.title}
        subtitle={content.features.subtitle}
        cards={content.features.cards}
      />
      
      {/* Statistics Section */}
      <StatisticsSection statistics={content.statistics} />
      
      {/* Platform Features Section */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <CTASection />
      
      {/* PWA Install Prompt - Solo en inicio */}
      <PWAPrompt />
    </main>
  );
}
