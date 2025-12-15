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
    // console.log('Subscribing to personal plan:', planId, billingCycle);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
                Suscripciones
              </h1>
            </div>
            <p className="text-xs text-[#6C757D] dark:text-gray-400 ml-12">
              Elige el plan perfecto para tu aprendizaje
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="inline-flex bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 rounded-lg p-1 border border-[#E9ECEF] dark:border-[#6C757D]/30">
              <motion.button
                onClick={() => setActiveTab('personal')}
                className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
                  activeTab === 'personal'
                    ? 'text-[#0A2540] dark:text-white'
                    : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
                }`}
              >
                {activeTab === 'personal' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative flex items-center gap-2 z-10">
                  <User className="w-4 h-4" />
                  Suscripciones Personales
                </div>
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('business')}
                className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
                  activeTab === 'business'
                    ? 'text-[#0A2540] dark:text-white'
                    : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
                }`}
              >
                {activeTab === 'business' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative flex items-center gap-2 z-10">
                  <Building2 className="w-4 h-4" />
                  Suscripciones Business
                </div>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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

