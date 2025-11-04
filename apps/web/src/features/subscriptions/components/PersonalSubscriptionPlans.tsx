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
} from 'lucide-react';
import { PersonalSubscriptionService } from '../services/personal-subscription.service';
import { PersonalPlan, BillingCycle } from '../types/subscription.types';
import { Button } from '@aprende-y-aplica/ui';

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

  const handleSubscribe = (plan: PersonalPlan) => {
    if (onSubscribe) {
      onSubscribe(plan.id, billingCycle);
    } else {
      // TODO: Implementar lógica de suscripción
      console.log(`Subscribing to ${plan.id} with ${billingCycle} billing`);
    }
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
        return 'from-blue-500 to-blue-600';
      case 'premium':
        return 'from-purple-500 to-purple-600';
      case 'pro':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="w-full">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
            billingCycle === 'yearly'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Anual
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Ahorra ~17%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                plan.isPopular
                  ? 'border-primary shadow-xl scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              } ${isCurrentPlan ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-lg text-sm font-semibold z-10">
                  {plan.badge || 'Más Popular'}
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 rounded-br-lg text-sm font-semibold z-10">
                  Plan Actual
                </div>
              )}

              {/* Header */}
              <div className={`bg-gradient-to-br ${getPlanColor(plan.id)} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  {getPlanIcon(plan.id)}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">{plan.tagline}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formattedPrice}</span>
                  <span className="text-white/70">
                    /{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
                {billingCycle === 'yearly' && savings > 0 && (
                  <p className="text-white/80 text-sm mt-2">
                    Ahorra {savings}% vs plan mensual
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="p-6 bg-white dark:bg-gray-800">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  variant={plan.isPopular ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Plan Activo
                    </>
                  ) : (
                    <>
                      Suscribirse ahora
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Todas las suscripciones incluyen cancelación en cualquier momento. Sin cargos ocultos.
        </p>
      </div>
    </div>
  );
}

