'use client';

import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Statistic } from '@shared/types/content';
import { fadeIn, slideUp } from '../../../shared/utils/animations';
import { useRef } from 'react';

interface StatisticsSectionProps {
  statistics: Statistic[];
}

// Componente para animar números
function AnimatedCounter({ endValue, duration = 2 }: { endValue: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const numericValue = parseInt(endValue.replace(/[^\d]/g, ''));
    if (isNaN(numericValue)) {
      setCount(endValue);
      return;
    }

    const increment = numericValue / (duration * 60); // 60fps
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= numericValue) {
          clearInterval(timer);
          return numericValue;
        }
        return next;
      });
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [endValue, duration, isInView]);

  return (
    <div ref={ref} className="text-6xl lg:text-7xl font-bold">
      {typeof count === 'number' ? Math.floor(count).toLocaleString() : count}
    </div>
  );
}

export function StatisticsSection({ statistics }: StatisticsSectionProps) {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-success" />
      
      {/* Overlay Pattern */}
      <div className="absolute inset-0 bg-carbon/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Statistics Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
              }
            }
          }}
        >
          {statistics.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={slideUp}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="text-white mb-2"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <AnimatedCounter endValue={stat.value} />
              </motion.div>
              <motion.p
                className="text-xl text-white/90 font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
              >
                {stat.label}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse" />
      <div className="absolute top-20 right-20 w-6 h-6 bg-white/10 rounded-full animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-20 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-500" />
      <div className="absolute bottom-10 right-10 w-5 h-5 bg-white/15 rounded-full animate-pulse delay-1500" />
    </section>
  );
}

