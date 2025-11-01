'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { ArrowRight, Users, Award, Sparkles, TrendingUp } from 'lucide-react';

export default function WhatWeDoPage() {
  const solutions = [
    {
      id: 'enterprise-training',
      icon: Users,
      title: 'Capacitación empresarial a escala',
      description: 'Transforma toda tu organización con programas de aprendizaje personalizados que se adaptan a las necesidades de cada equipo.',
      features: ['Escalable a miles de usuarios', 'Contenido personalizado', 'Medición de impacto']
    },
    {
      id: 'certifications',
      icon: Award,
      title: 'Preparación para certificaciones',
      description: 'Prepara a tu equipo para certificaciones profesionales reconocidas por la industria.',
      features: ['Paths de certificación', 'Simuladores de examen', 'Certificados verificables']
    },
    {
      id: 'ai-skills',
      icon: Sparkles,
      title: 'Habilidades de IA generativa',
      description: 'Impulsa la productividad con las últimas habilidades en inteligencia artificial y automatización.',
      features: ['Cursos de IA actualizados', 'Hands-on labs', 'Casos de uso reales']
    },
    {
      id: 'leadership',
      icon: TrendingUp,
      title: 'Desarrollo de liderazgo',
      description: 'Identifica y cultiva líderes dentro de tu organización con programas diseñados para el crecimiento.',
      features: ['Assessment de habilidades', 'Coaching individual', 'Tracks personalizados']
    }
  ];

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
              Lo que hacemos
            </motion.h1>
            <motion.p
              className="text-xl max-w-3xl mx-auto opacity-80"
              variants={fadeIn}
            >
              Soluciones integrales de aprendizaje diseñadas para transformar tu organización
            </motion.p>
          </motion.div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {solutions.map((solution, idx) => {
              const IconComponent = solution.icon;
              return (
                <motion.div
                  key={solution.id}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="bg-glass border border-glass-light rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{solution.title}</h3>
                  <p className="text-text-secondary mb-6">{solution.description}</p>
                  <ul className="space-y-3">
                    {solution.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

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
              ¿Listo para transformar tu organización?
            </h2>
            <p className="text-xl mb-8 opacity-80">
              Descubre cómo nuestras soluciones pueden adaptarse a tus necesidades
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/business/plans">
                <Button variant="gradient" size="lg" className="group shadow-lg">
                  <span className="flex items-center gap-2">
                    Ver Planes
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/business/how-it-works">
                <Button variant="outline" size="lg">
                  Cómo Funciona
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

