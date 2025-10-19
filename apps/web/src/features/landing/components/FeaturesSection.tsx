'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Icon, IconName } from '@aprende-y-aplica/ui';
import { FeatureCard } from '@shared/types/content';
import { fadeIn, staggerContainer, staggerItem, scaleOnHover } from '../../../shared/utils/animations';

interface FeaturesSectionProps {
  title: string;
  subtitle: string;
  cards: FeatureCard[];
}

export function FeaturesSection({ title, subtitle, cards }: FeaturesSectionProps) {
  return (
    <section className="py-24 bg-surface/50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-carbon/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={staggerItem}
              whileHover="hover"
              initial="rest"
            >
              <Card 
                variant="default" 
                className="h-full hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                animate={true}
              >
                <CardHeader className="text-center">
                  <motion.div
                    className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-success/30 transition-all duration-300"
                    variants={scaleOnHover}
                  >
                    <Icon 
                      name={card.icon as IconName} 
                      size="lg" 
                      color="currentColor"
                      className="text-primary group-hover:text-primary/80 transition-colors"
                      animate={true}
                    />
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-300 group-hover:text-gray-200 transition-colors">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
