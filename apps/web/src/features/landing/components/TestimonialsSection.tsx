'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@aprende-y-aplica/ui';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Testimonial } from '@shared/types/content';
import { fadeIn, slideUp } from '../../../shared/utils/animations';

interface TestimonialsSectionProps {
  title: string;
  items: Testimonial[];
}

export function TestimonialsSection({ title, items }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentTestimonial = items[currentIndex];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-24 relative overflow-hidden testimonials-section">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 testimonials-title">
            {title}
          </h2>
        </motion.div>

        {/* Testimonial Card */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={slideUp}
        >
          <Card 
            variant="glassmorphism" 
            className="relative overflow-hidden"
          >
            {/* Quote Icon - Posicionado completamente fuera del contenido */}
            <div className="absolute top-6 left-6 z-10">
              <Quote className="w-8 h-8 testimonials-quote-icon" />
            </div>
            
            <CardContent className="p-4 sm:p-8 lg:p-12 pt-16 pl-14 sm:pl-16 lg:pl-12 pr-14 sm:pr-16 lg:pr-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  {/* Quote sin comillas manuales */}
                  <blockquote className="text-xl lg:text-2xl leading-relaxed mb-8 font-light italic testimonials-quote-text">
                    {currentTestimonial.quote}
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {currentTestimonial.author.split(' ').map(name => name[0]).join('')}
                      </div>
                      
                      {/* Author Info */}
                      <div>
                        <h4 className="font-semibold text-lg testimonials-author-name">
                          {currentTestimonial.author}
                        </h4>
                        <p className="text-sm testimonials-author-role">
                          {currentTestimonial.role}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Navigation Controls - Only shown on very small screens */}
                    <div className="flex items-center gap-2 sm:hidden">
                      <button
                        onClick={goToPrevious}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 testimonials-nav-button-mobile"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 testimonials-nav-button-mobile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {/* Navigation Arrows - Hidden on very small screens to prevent overlap */}
            {items.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="hidden sm:flex absolute -left-2 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm rounded-full items-center justify-center transition-all duration-300 group z-20 hover:scale-110 testimonials-nav-button"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={goToNext}
                  className="hidden sm:flex absolute -right-2 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm rounded-full items-center justify-center transition-all duration-300 group z-20 hover:scale-110 testimonials-nav-button"
                >
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </Card>

          {/* Pagination Dots */}
          {items.length > 1 && (
            <motion.div
              className="flex justify-center gap-3 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'testimonials-pagination-dot active scale-125'
                      : 'testimonials-pagination-dot backdrop-blur-sm'
                  }`}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
