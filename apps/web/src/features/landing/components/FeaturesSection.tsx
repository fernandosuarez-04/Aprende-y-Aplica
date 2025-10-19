'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Icon, IconName } from '@aprende-y-aplica/ui';
import { FeatureCard } from '@shared/types/content';
import { fadeIn, staggerContainer, staggerItem, scaleOnHover } from '../../../shared/utils/animations';
import { useParallax } from '../../../shared/hooks/useParallax';

interface FeaturesSectionProps {
  title: string;
  subtitle: string;
  cards: FeatureCard[];
}

export function FeaturesSection({ title, subtitle, cards }: FeaturesSectionProps) {
  const parallaxOffset = useParallax(0.3);

  return (
    <section className="py-24 relative overflow-hidden features-section">
      {/* Background Effects con parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(to top, var(--color-bg-dark) / 10%, transparent)',
          y: parallaxOffset * 0.5 
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 features-title">
            {title}
          </h2>
          <p className="text-xl max-w-3xl mx-auto features-subtitle">
            {subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={staggerItem}
              whileHover={{ y: -5 }}
              initial="rest"
              style={{ y: parallaxOffset * 0.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="h-full flex flex-col"
              >
                <Card 
                  variant="default" 
                  className="h-full cursor-pointer group relative flex flex-col"
                  animate={true}
                >
                  <CardHeader className="text-center flex-shrink-0">
                    <motion.div
                      className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary/40 group-hover:to-success/40 transition-all duration-500 overflow-hidden"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                    >
                      {card.icon ? (
                        <Icon 
                          name={card.icon as IconName} 
                          size="lg" 
                          color="currentColor"
                          className="text-primary group-hover:text-primary transition-colors duration-300"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary/20 rounded" />
                      )}
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                        {card.title}
                      </CardTitle>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center">
                    <motion.div
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardDescription className="text-center transition-colors duration-300">
                        {card.description}
                      </CardDescription>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
