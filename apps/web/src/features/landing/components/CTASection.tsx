'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { ArrowRight } from 'lucide-react';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../shared/utils/animations';

interface CTASectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
}

export function CTASection({ title, subtitle, buttonText }: CTASectionProps) {
  return (
    <section className="py-24 relative overflow-hidden cta-section">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-success/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          {/* Title */}
          <motion.h2
            className="text-4xl lg:text-6xl font-bold mb-6 cta-title"
            variants={slideUp}
          >
            {title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="text-xl lg:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed cta-subtitle"
            variants={fadeIn}
          >
            {subtitle}
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={staggerItem}>
            <Link href="/auth">
              <Button
                size="lg"
                variant="gradient"
                className="group shadow-2xl shadow-primary/25 hover:shadow-primary/40 text-lg px-12 py-4 relative overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="relative z-10 flex items-center gap-3">
                  {buttonText}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
          </motion.div>

          {/* Additional Visual Elements */}
          <motion.div
            className="mt-16 flex justify-center gap-8 opacity-60"
            variants={staggerItem}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: item * 0.3,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
