'use client';

import React, { useState, useEffect } from 'react';
import { ContentService } from '../core/services/contentService';
import { LandingPageContent } from '@aprende-y-aplica/shared';
import { HeroSection } from '../features/landing/components/HeroSection';
import { FeaturesSection } from '../features/landing/components/FeaturesSection';
import { StatisticsSection } from '../features/landing/components/StatisticsSection';
import { TestimonialsSection } from '../features/landing/components/TestimonialsSection';
import { PWAPrompt } from '../core/components/PWAPrompt';
import { CTASection } from '../features/landing/components/CTASection';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
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
        setError(t('landing.errors.loadContent'));
        // console.error('Error loading content:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-contrast)]/70 transition-colors duration-300">{t('landing.loading')}</p>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-contrast)] mb-4 transition-colors duration-300">{t('landing.errors.title')}</h1>
          <p className="text-[var(--color-contrast)]/70 mb-8 transition-colors duration-300">{error || t('landing.errors.noContent')}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('landing.errors.retry')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-dark)] transition-colors duration-300">
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
      
      {/* Testimonials Section */}
      <TestimonialsSection 
        title={content.testimonials.title}
        items={content.testimonials.items}
      />
      
      {/* CTA Section */}
      <CTASection 
        title={content.cta.title}
        subtitle={content.cta.subtitle}
        buttonText={content.cta.buttonText}
      />
      
      {/* PWA Install Prompt - Solo en inicio */}
      <PWAPrompt />
    </main>
  );
}
