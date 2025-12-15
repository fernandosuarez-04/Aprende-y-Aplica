'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Crown,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  BookOpen,
  Gift,
  MessageCircle,
  Award,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import { PersonalSubscriptionService } from '../services/personal-subscription.service';
import { PersonalPlan, BillingCycle } from '../types/subscription.types';
import { useShoppingCartStore } from '@/core/stores/shoppingCartStore';

interface PersonalSubscriptionPlansProps {
  onSubscribe?: (planId: string, billingCycle: BillingCycle) => void;
  currentPlanId?: string;
  currentBillingCycle?: BillingCycle;
}

export function PersonalSubscriptionPlans({
  onSubscribe,
  currentPlanId,
  currentBillingCycle,
}: PersonalSubscriptionPlansProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const plans = PersonalSubscriptionService.getPersonalPlans();
  const { addItem } = useShoppingCartStore();

  const handleSubscribe = (plan: PersonalPlan) => {
    if (onSubscribe) {
      onSubscribe(plan.id, billingCycle);
    } else {
      // TODO: Implementar lógica de suscripción
      // console.log(`Subscribing to ${plan.id} with ${billingCycle} billing`);
    }
  };

  const handleAddToCart = (plan: PersonalPlan, price: number) => {
    const cartItemId = `subscription-${plan.id}-${billingCycle}`;
    addItem({
      id: cartItemId,
      itemType: 'subscription',
      itemId: plan.id,
      title: `${plan.name} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
      price: price,
    });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <BookOpen className="w-6 h-6" />;
      case 'premium':
        return <Star className="w-6 h-6" />;
      case 'pro':
        return <Crown className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'basic':
        return 'bg-[#0A2540]';
      case 'premium':
        return 'bg-[#00D4B3]';
      case 'pro':
        return 'bg-[#F59E0B]';
      default:
        return 'bg-[#6C757D]';
    }
  };

  return (
    <div className="w-full">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="inline-flex bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 rounded-lg p-1 border border-[#E9ECEF] dark:border-[#6C757D]/30">
          <motion.button
            onClick={() => setBillingCycle('monthly')}
            className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
              billingCycle === 'monthly'
                ? 'text-[#0A2540] dark:text-white'
                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
            }`}
          >
            {billingCycle === 'monthly' && (
              <motion.div
                layoutId="billingCycle"
                className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Mensual</span>
          </motion.button>
          <motion.button
            onClick={() => setBillingCycle('yearly')}
            className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
              billingCycle === 'yearly'
                ? 'text-[#0A2540] dark:text-white'
                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
            }`}
          >
            {billingCycle === 'yearly' && (
              <motion.div
                layoutId="billingCycle"
                className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              Anual
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: billingCycle === 'yearly' ? 1 : 0 }}
                className="inline-block bg-[#10B981] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold"
              >
                Ahorra ~17%
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {plans.map((plan, index) => {
          const price = PersonalSubscriptionService.calculatePrice(plan, billingCycle);
          const formattedPrice = PersonalSubscriptionService.formatPrice(price, plan.currency);
          const isCurrentPlan = currentPlanId === plan.id && currentBillingCycle === billingCycle;
          const savings = PersonalSubscriptionService.calculateYearlySavings(plan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-xl border overflow-hidden transition-all flex flex-col h-full ${
                plan.isPopular
                  ? 'border-[#0A2540] dark:border-[#00D4B3] shadow-lg scale-[1.02]'
                  : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50'
              } ${isCurrentPlan ? 'ring-2 ring-[#10B981] ring-offset-2 dark:ring-offset-[#0F1419]' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: index * 0.1 + 0.2 }}
                  className="absolute top-0 right-0 bg-[#0A2540] dark:bg-[#00D4B3] text-white px-3 py-1 rounded-bl-lg text-xs font-semibold z-10"
                >
                  {plan.badge || 'Más Popular'}
                </motion.div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 left-0 bg-[#10B981] text-white px-3 py-1 rounded-br-lg text-xs font-semibold z-10"
                >
                  Plan Actual
                </motion.div>
              )}

              {/* Header */}
              <div className={`${getPlanColor(plan.id)} p-5 text-white`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-white/90 text-xs mb-3">{plan.tagline}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold">{formattedPrice}</span>
                  <span className="text-white/80 text-sm">
                    /{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
                {billingCycle === 'yearly' && savings > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/90 text-xs mt-2 font-medium"
                  >
                    Ahorra {savings}% vs plan mensual
                  </motion.p>
                )}
              </div>

              {/* Features */}
              <div className="p-5 bg-white dark:bg-[#1E2329] flex flex-col flex-1 min-h-0">
                <ul className="space-y-2.5 flex-grow min-h-0 mb-4">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + featureIndex * 0.03 }}
                      className="flex items-start gap-2.5"
                    >
                      <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[#0A2540] dark:text-gray-300 leading-relaxed">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                <div className="flex gap-2 mt-auto flex-shrink-0">
                  <button
                    onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                    disabled={isCurrentPlan}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                      isCurrentPlan
                        ? 'bg-[#10B981] text-white cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white'
                        : 'bg-[#E9ECEF] dark:bg-[#0A2540]/20 hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/30 text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30'
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4" />
                        Plan Activo
                      </>
                    ) : (
                      <>
                        Suscribirse ahora
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {!isCurrentPlan && (
                    <button
                      onClick={() => handleAddToCart(plan, price)}
                      className="px-3 py-2.5 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 text-[#0A2540] dark:text-white rounded-md transition-colors border border-[#E9ECEF] dark:border-[#6C757D]/30"
                      title="Agregar al carrito"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#6C757D] dark:text-gray-400">
          Todas las suscripciones incluyen cancelación en cualquier momento. Sin cargos ocultos.
        </p>
      </div>
    </div>
  );
}

