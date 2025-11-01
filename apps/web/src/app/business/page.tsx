'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@aprende-y-aplica/ui';
import { ContentService } from '../../core/services/contentService';
import { BusinessPageContent } from '@aprende-y-aplica/shared';
import { HeroBusinessSection } from '../../features/landing/components/business/HeroBusinessSection';
import { FeaturesSection } from '../../features/landing/components/FeaturesSection';
import { InstructorsSection } from '../../features/landing/components/business/InstructorsSection';
import { TestimonialsSection } from '../../features/landing/components/TestimonialsSection';
import { CTASection } from '../../features/landing/components/CTASection';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../shared/utils/animations';
import { ArrowRight } from 'lucide-react';

export default function BusinessHomePage() {
  const [content, setContent] = useState<BusinessPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        const result = await ContentService.getBusinessPageContent();
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setContent(result.data);
        }
      } catch (err) {
        setError('Error al cargar el contenido');
        console.error('Error loading content:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-8">{error || 'No se pudo cargar el contenido'}</p>
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
    <main className="min-h-screen bg-carbon pt-0">
      {/* Hero Section */}
      <HeroBusinessSection content={content.hero} />
      
      {/* Statistics Section */}
      <section className="py-16 bg-carbon/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-3 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { value: '500+', label: 'Empresas', icon: '🏢' },
              { value: '50K+', label: 'Usuarios', icon: '👥' },
              { value: '100+', label: 'Instructores', icon: '🎓' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                className="relative"
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-lg opacity-70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Carousel Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Sea cual sea tu objetivo, el camino empieza aquí
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                id: 'enterprise-training',
                icon: '🏢',
                title: 'Capacitación a nivel de empresa',
                description: 'Mejora las habilidades de toda tu organización',
                link: '/business/what-we-do',
              },
              {
                id: 'certifications',
                icon: '🎖️',
                title: 'Preparación para certificaciones',
                description: 'Desarrolla y valida habilidades',
                link: '/business/what-we-do',
              },
              {
                id: 'ai-skills',
                icon: '🤖',
                title: 'Obtención de nuevas habilidades con IA',
                description: 'Aumenta la productividad con IA generativa',
                link: '/business/how-it-works',
              },
              {
                id: 'leadership',
                icon: '👤',
                title: 'Desarrollo de liderazgo',
                description: 'Identifica y empodera a los líderes',
                link: '/business/resources',
              },
            ].map((useCase, idx) => (
              <motion.div
                key={useCase.id}
                variants={staggerItem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Link href={useCase.link}>
                  <div className="bg-glass border border-glass-light rounded-2xl p-8 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                    <div className="text-5xl mb-4">{useCase.icon}</div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {useCase.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-4">
                      {useCase.description}
                    </p>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Ver más
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Client Logos Section */}
      <section className="py-16 bg-carbon/30">
        <div className="container mx-auto px-4">
          <motion.p
            className="text-center text-sm uppercase tracking-wider mb-8 opacity-70"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            Empresas que confían en nosotros
          </motion.p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['Citi', 'Ford', 'Mattel', 'Volkswagen', 'Bosch', 'Vimeo'].map((company, idx) => (
              <div key={idx} className="text-2xl font-bold text-text-secondary">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Benefits Section */}
      <FeaturesSection 
        title={content.benefits.title}
        subtitle={content.benefits.subtitle}
        cards={content.benefits.cards}
      />
      
      {/* Featured Instructors */}
      <InstructorsSection
        title={content.instructors.title}
        subtitle={content.instructors.subtitle}
        instructors={content.instructors.items}
      />
      
      {/* CTA Section */}
      <CTASection 
        title={content.cta.title}
        subtitle={content.cta.subtitle}
        buttonText={content.cta.buttonText}
      />
    </main>
  );
}
