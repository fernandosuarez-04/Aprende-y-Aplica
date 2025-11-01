'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';
import { ComparisonCategory } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';

interface ComparisonTableProps {
  title: string;
  subtitle: string;
  categories: ComparisonCategory[];
}

export function ComparisonTable({ title, subtitle, categories }: ComparisonTableProps) {
  return (
    <section className="py-24 relative overflow-hidden bg-carbon/30">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-4xl lg:text-5xl font-bold mb-6"
            variants={slideUp}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-xl max-w-3xl mx-auto"
            variants={fadeIn}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Scroll Container */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            {/* Table */}
            <motion.div
              className="bg-glass rounded-2xl overflow-hidden border border-glass-light"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
            >
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-glass-light bg-gradient-to-r from-primary/5 to-success/5">
                <div className="font-bold text-lg">Característica</div>
                <div className="text-center font-bold text-lg">Team</div>
                <div className="text-center font-bold text-lg">
                  Business
                  <span className="block text-sm text-primary font-normal">Más Popular</span>
                </div>
                <div className="text-center font-bold text-lg">Enterprise</div>
              </div>

              {/* Categories */}
              {categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="border-b border-glass-light last:border-b-0">
                  {/* Category Header */}
                  <div className="bg-carbon/50 p-4">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                  </div>
                  
                  {/* Features */}
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="grid grid-cols-4 gap-4 p-4 hover:bg-glass-light/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (categoryIndex * 0.1) + (featureIndex * 0.05) }}
                    >
                      {/* Feature Name */}
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          {feature.description && (
                            <div className="text-sm opacity-70 mt-1">{feature.description}</div>
                          )}
                          {feature.notes && (
                            <div className="flex items-center gap-1 text-xs text-primary mt-1">
                              <Info className="w-3 h-3" />
                              <span>{feature.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Team */}
                      <div className="flex justify-center items-center">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {feature.team ? (
                            <Check className="w-6 h-6 text-success" />
                          ) : (
                            <X className="w-6 h-6 text-gray-500" />
                          )}
                        </motion.div>
                      </div>
                      
                      {/* Business */}
                      <div className="flex justify-center items-center">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {feature.business ? (
                            <Check className="w-6 h-6 text-success" />
                          ) : (
                            <X className="w-6 h-6 text-gray-500" />
                          )}
                        </motion.div>
                      </div>
                      
                      {/* Enterprise */}
                      <div className="flex justify-center items-center">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {feature.enterprise ? (
                            <Check className="w-6 h-6 text-success" />
                          ) : (
                            <X className="w-6 h-6 text-gray-500" />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

