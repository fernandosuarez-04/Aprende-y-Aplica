'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, Button } from '@aprende-y-aplica/ui';
import { HeroContent } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, slideInFromLeft, slideInFromRight, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { ArrowRight, Check, TrendingUp, Users, Shield } from 'lucide-react';

interface HeroBusinessSectionProps {
  content: HeroContent;
}

export function HeroBusinessSection({ content }: HeroBusinessSectionProps) {
  const { title, highlightWord, description, ctaText, benefits } = content;

  return (
    <section className="min-h-screen flex items-start relative overflow-hidden hero-section pt-32 lg:pt-36 bg-white dark:bg-[#0F1419]">

      <div className="container mx-auto px-4 relative z-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Title */}
            <motion.h1
              className="text-5xl lg:text-7xl font-bold leading-tight text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              variants={slideUp}
            >
              <span>{title}</span>
              <br />
              <span className="text-[#00D4B3]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                {highlightWord}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-xl leading-relaxed max-w-2xl text-[#6C757D] dark:text-white/90"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              variants={fadeIn}
            >
              {description}
            </motion.p>

            {/* Statistics */}
            <motion.div
              variants={staggerItem}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
            >
              {[
                { value: "500+", label: "Empresas" },
                { value: "50K+", label: "Usuarios" },
                { value: "100+", label: "Instructores" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                >
                  <div className="text-3xl font-bold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#6C757D] dark:text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="#contact" className="flex-1">
                <Button
                  size="lg"
                  variant="primary"
                  className="group shadow-lg bg-[#0A2540] hover:bg-[#0d2f4d] text-white relative overflow-hidden w-full"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {ctaText}
                    <ArrowRight className="w-5 h-5 text-white" />
                  </span>
                </Button>
              </Link>
              <Link href="/business/plans" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-[#0A2540] dark:border-[#00D4B3] text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#0A2540]/10 dark:hover:bg-[#00D4B3]/10"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Ver Precios
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Benefits Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideInFromRight}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <Card variant="glassmorphism" className="h-fit relative overflow-hidden bg-white dark:bg-[#1E2329]/95 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                <CardContent className="p-8 relative z-10">
                  <motion.h3 
                    className="text-2xl font-bold mb-6 text-[#0A2540] dark:text-white"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Beneficios Empresariales
                  </motion.h3>
                  <div className="space-y-4">
                    <motion.div
                      className="flex items-center gap-3 group hero-benefit-text"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 8 }}
                    >
                      <div 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#00D4B3' }}
                      >
                        <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#0A2540] dark:text-white/90" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        Capacitación escalable para toda tu organización
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex items-center gap-3 group hero-benefit-text"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ x: 8 }}
                    >
                      <div 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#00D4B3' }}
                      >
                        <Users className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#0A2540] dark:text-white/90" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        Gestión centralizada de aprendizaje
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex items-center gap-3 group hero-benefit-text"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      whileHover={{ x: 8 }}
                    >
                      <div 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#00D4B3' }}
                      >
                        <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#0A2540] dark:text-white/90" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        Reportes detallados de progreso y certificaciones
                      </span>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

