'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card, CardContent, Badge } from '@aprende-y-aplica/ui';
import { PricingTier } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { Check, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  title: string;
  subtitle: string;
  tiers: PricingTier[];
}

interface PricingWithAnnual extends PricingTier {
  annualPrice?: string;
}

export function PricingSection({ title, subtitle, tiers }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  
  // Calcular precios anuales (20% descuento)
  const tiersWithAnnual: PricingWithAnnual[] = tiers.map(tier => {
    if (tier.price === 'Personalizado') {
      return { ...tier, annualPrice: 'Personalizado' };
    }
    const monthlyPrice = parseFloat(tier.price.replace(/[^0-9.]/g, ''));
    const annualPrice = monthlyPrice * 12 * 0.8; // 20% descuento
    return {
      ...tier,
      annualPrice: `$${Math.round(annualPrice)}`
    };
  });
  return (
    <section className="py-24 relative overflow-hidden bg-carbon/50">
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
            className="text-xl max-w-3xl mx-auto mb-8"
            variants={fadeIn}
          >
            {subtitle}
          </motion.p>
          
          {/* Billing Toggle */}
          <motion.div
            variants={fadeIn}
            className="flex items-center justify-center gap-4"
          >
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-text-secondary'}`}>
              Mensual
            </span>
            <motion.button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 bg-carbon rounded-full p-1 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-6 h-6 bg-gradient-to-r from-primary to-success rounded-full absolute"
                animate={{
                  x: isAnnual ? 24 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
              {isAnnual && (
                <motion.div
                  className="absolute -right-12 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-success flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-white px-1">
                      20%
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-success whitespace-nowrap">
                    OFF
                  </span>
                </motion.div>
              )}
            </motion.button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-text-secondary'}`}>
              Anual
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Tiers Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {tiersWithAnnual.map((tier, index) => (
            <motion.div
              key={tier.id}
              variants={staggerItem}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`relative h-full flex flex-col ${tier.isPopular ? 'lg:-mt-8 lg:mb-8' : ''}`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
                  <Badge variant="gradient" className="text-sm px-4 py-1 shadow-lg">
                    Más Popular
                  </Badge>
                </div>
              )}
              <Card 
                variant={tier.isPopular ? 'default' : 'glassmorphism'}
                className={`h-full relative overflow-visible transition-all duration-300 flex flex-col ${
                  tier.isPopular 
                    ? 'border-primary border-2 shadow-2xl shadow-primary/20' 
                    : 'hover:border-primary/50 hover:shadow-xl'
                }`}
              >
                {tier.isPopular && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-600 to-success" />
                    <motion.div
                      className="absolute -top-2 left-4 bg-gradient-to-r from-primary to-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold z-10"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      ⭐ RECOMENDADO
                    </motion.div>
                  </>
                )}
                <CardContent className="p-8 flex flex-col flex-1 h-full min-h-0">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-sm opacity-70 mb-6 min-h-[40px]">{tier.description}</p>
                    <div className="mb-6 px-2">
                      <motion.span 
                        key={isAnnual ? 'annual' : 'monthly'}
                        className={`font-bold block break-words whitespace-normal ${
                          tier.price === 'Personalizado' || tier.annualPrice === 'Personalizado'
                            ? 'text-3xl lg:text-4xl'
                            : 'text-5xl'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isAnnual && tier.annualPrice ? tier.annualPrice : tier.price}
                      </motion.span>
                      {tier.period && (tier.price !== 'Personalizado' && tier.annualPrice !== 'Personalizado') && (
                        <span className="text-lg opacity-70">{isAnnual ? '/año' : '/mes'}</span>
                      )}
                      {tier.price !== 'Personalizado' && (
                        <div className="text-xs opacity-60 mt-2">
                          {isAnnual ? `$${Math.round(parseFloat(tier.price.replace(/[^0-9.]/g, '')) * 12 * 0.8 / 12)}/mes facturado anualmente` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features - con flex-grow para ocupar el espacio disponible */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((feature, idx) => (
                      <motion.li 
                        key={idx} 
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <motion.div whileHover={{ scale: 1.2, rotate: 5 }}>
                          <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <span className="text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA - siempre al final gracias a flex-grow en features */}
                  <Link href="/auth?type=business" className="block mt-auto">
                    <Button
                      variant={tier.isPopular ? 'gradient' : 'outline'}
                      className="w-full group"
                      size="lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {tier.ctaText}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

