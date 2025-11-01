'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card, CardContent, Badge } from '@aprende-y-aplica/ui';
import { PricingSection } from '../../../features/landing/components/business/PricingSection';
import { ComparisonTable } from '../../../features/landing/components/business/ComparisonTable';
import { FAQSection } from '../../../features/landing/components/business/FAQSection';
import { TestimonialsSection } from '../../../features/landing/components/TestimonialsSection';
import { ContentService } from '../../../core/services/contentService';
import { BusinessPageContent } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer } from '../../../shared/utils/animations';
import { Check, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function PlansPage() {
  const [content, setContent] = useState<BusinessPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const result = await ContentService.getBusinessPageContent();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setContent(result.data);
        }
      } catch (err) {
        setError('Error al cargar el contenido');
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-carbon flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return <div>Error</div>;
  }

  return (
    <main className="min-h-screen bg-carbon">
      {/* Hero Section */}
      <section className="py-32 pt-40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h1
              className="text-5xl lg:text-6xl font-bold mb-6"
              variants={slideUp}
            >
              Elige tu plan ideal
            </motion.h1>
            <motion.p
              className="text-xl max-w-3xl mx-auto opacity-80"
              variants={fadeIn}
            >
              Soluciones flexibles que crecen con tu negocio
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection
        title={content.companies.pricing.title}
        subtitle={content.companies.pricing.subtitle}
        tiers={content.companies.pricing.tiers}
      />

      {/* Comparison Table */}
      <ComparisonTable
        title={content.companies.comparison.title}
        subtitle={content.companies.comparison.subtitle}
        categories={content.companies.comparison.categories}
      />

      {/* FAQs */}
      <FAQSection
        title={content.companies.faq.title}
        subtitle={content.companies.faq.subtitle}
        faqs={content.companies.faq.items}
        category="companies"
      />

      {/* CTA Section */}
      <section className="py-24 bg-carbon/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl font-bold mb-6">
              ¿Necesitas algo personalizado?
            </h2>
            <p className="text-xl mb-8 opacity-80">
              Contacta con nuestro equipo para un plan Enterprise a medida
            </p>
            <Link href="/auth">
              <Button variant="gradient" size="lg" className="group shadow-lg">
                <span className="flex items-center gap-2">
                  Hablar con Ventas
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

