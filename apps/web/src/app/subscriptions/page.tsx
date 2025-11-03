'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, User, Building2 } from 'lucide-react';
import { PersonalSubscriptionPlans } from '../../features/subscriptions/components/PersonalSubscriptionPlans';
import { BusinessSubscriptionPlans } from '../../features/business-panel/components/BusinessSubscriptionPlans';
import { useAuth } from '../../features/auth/hooks/useAuth';

type TabType = 'personal' | 'business';

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const { user } = useAuth();

  const handlePersonalSubscribe = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar lógica de suscripción personal
    console.log('Subscribing to personal plan:', planId, billingCycle);
  };

  return (
    <div className="min-h-screen bg-carbon dark:bg-carbon-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Suscripciones
            </h1>
            <p className="text-text-tertiary">
              Elige el plan perfecto para tu aprendizaje
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeTab === 'personal'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Suscripciones Personales
                </div>
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeTab === 'business'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Suscripciones Business
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'personal' ? (
              <PersonalSubscriptionPlans onSubscribe={handlePersonalSubscribe} />
            ) : (
              <BusinessSubscriptionPlans />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

