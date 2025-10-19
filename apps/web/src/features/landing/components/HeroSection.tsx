'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Badge, Button } from '@aprende-y-aplica/ui';
import { ArrowRight, Check } from 'lucide-react';
import { HeroContent } from '@shared/types/content';
import { fadeIn, slideUp, slideInFromLeft, slideInFromRight, staggerContainer, staggerItem } from '../../../shared/utils/animations';

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const { tag, title, highlightWord, description, ctaText, benefits } = content;

  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-carbon to-carbon/80 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-success/5" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse delay-1000" />

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
              <span className="text-white">{title}</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent animate-pulse">
                {highlightWord}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-xl text-gray-300 leading-relaxed max-w-2xl"
              variants={fadeIn}
            >
              {description}
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={staggerItem}>
              <Button
                size="lg"
                variant="gradient"
                className="group shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                {ctaText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Benefits Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideInFromRight}
            transition={{ delay: 0.3 }}
          >
            <Card variant="glassmorphism" className="h-fit">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Lo que aprenderás
                </h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-3 text-white"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-primary to-success rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-200">{benefit.replace('✓ ', '')}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
