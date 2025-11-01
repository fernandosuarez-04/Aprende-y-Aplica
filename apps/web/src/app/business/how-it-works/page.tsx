'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../shared/utils/animations';
import { ArrowRight, Play, Users2, Rocket, BarChart } from 'lucide-react';

export default function HowItWorksPage() {
  const methodologies = [
    {
      icon: Play,
      title: 'Aprendizaje a pedido',
      description: 'Acceso ilimitado a miles de cursos actualizados regularmente'
    },
    {
      icon: Users2,
      title: 'Aprendizaje práctico',
      description: 'Proyectos hands-on y labs para aplicar conocimientos en tiempo real'
    },
    {
      icon: Rocket,
      title: 'Aprendizaje grupal',
      description: 'Programas dirigidos para equipos con metas compartidas'
    },
    {
      icon: BarChart,
      title: 'Servicios profesionales',
      description: 'Consultoría y soporte dedicado para maximizar tu inversión'
    }
  ];

  const processSteps = [
    { number: '1', title: 'Consulta', description: 'Evaluamos tus necesidades y objetivos' },
    { number: '2', title: 'Onboarding', description: 'Configuración rápida y capacitación del equipo' },
    { number: '3', title: 'Capacitación', description: 'Aprendizaje continuo y medición de progreso' },
    { number: '4', title: 'Medición', description: 'ROI y analytics para optimizar resultados' }
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
              Cómo lo hacemos
            </motion.h1>
            <motion.p
              className="text-xl max-w-3xl mx-auto opacity-80"
              variants={fadeIn}
            >
              Una metodología probada que combina flexibilidad, engagement y resultados medibles
            </motion.p>
          </motion.div>

          {/* Methodologies Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {methodologies.map((method, idx) => {
              const IconComponent = method.icon;
              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-glass border border-glass-light rounded-2xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{method.title}</h3>
                  <p className="text-sm text-text-secondary">{method.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-24 bg-carbon/30">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            Proceso de implementación
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -left-4 top-8 w-8 h-0.5 bg-primary hidden md:block" />
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-center mb-3">{step.title}</h3>
                <p className="text-center text-text-secondary">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl font-bold mb-6">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl mb-8 opacity-80">
              Inicia tu prueba gratuita de 14 días hoy mismo
            </p>
            <Link href="/business/plans">
              <Button variant="gradient" size="lg" className="group shadow-lg">
                <span className="flex items-center gap-2">
                  Comenzar Ahora
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

