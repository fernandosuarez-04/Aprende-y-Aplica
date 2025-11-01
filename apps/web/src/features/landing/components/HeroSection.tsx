'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@aprende-y-aplica/ui';
import { ArrowRight, Check } from 'lucide-react';
import { HeroContent } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, slideInFromLeft, slideInFromRight, staggerContainer, staggerItem } from '../../../shared/utils/animations';
import { AnimatedBackground } from '../../../core/components/AnimatedBackground';
import { useParallax } from '../../../shared/hooks/useParallax';

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const { tag, title, highlightWord, description, ctaText, benefits } = content;
  const parallaxOffset = useParallax(0.5);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden hero-section">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Background Effects con parallax */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-success/5"
        style={{ y: parallaxOffset * 0.3 }}
      />
      
      <motion.div 
        className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ y: parallaxOffset * 0.2 }}
      />
      
      <motion.div 
        className="absolute bottom-20 right-20 w-96 h-96 bg-success/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        style={{ y: parallaxOffset * 0.4 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Tag */}
            <motion.div variants={staggerItem}>
              <Badge variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
                {tag}
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-5xl lg:text-7xl font-bold leading-tight"
              variants={slideUp}
            >
              <span className="hero-title-text">{title}</span>
              <br />
              <motion.span 
                className="bg-gradient-to-r from-primary via-blue-600 to-success bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                {highlightWord}
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-xl leading-relaxed max-w-2xl hero-description-text"
              variants={fadeIn}
            >
              {description}
            </motion.p>

            {/* CTA Button */}
            <motion.div 
              variants={staggerItem}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="gradient"
                  className="group shadow-lg shadow-primary/25 hover:shadow-primary/50 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {ctaText}
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
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
            style={{ y: parallaxOffset * 0.1 }}
          >
            <motion.div
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <Card variant="glassmorphism" className="h-fit relative overflow-hidden">
                {/* Efecto shimmer en el borde */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative z-10">
                  <motion.h3 
                    className="text-2xl font-bold mb-6 hero-benefits-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Lo que aprenderás
                  </motion.h3>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 group hero-benefit-text"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ x: 8 }}
                      >
                        <motion.div 
                          className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-primary to-success rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                          animate={{
                            boxShadow: [
                              '0 0 0 rgba(0, 102, 204, 0.4)',
                              '0 0 20px rgba(0, 102, 204, 0.6)',
                              '0 0 0 rgba(0, 102, 204, 0.4)',
                            ],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: index * 0.5,
                          }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                        <span className="transition-colors hero-benefit-description">
                          {benefit.replace('✓ ', '')}
                        </span>
                      </motion.div>
                    ))}
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
