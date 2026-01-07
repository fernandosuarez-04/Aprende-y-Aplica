'use client'

import { motion } from 'framer-motion'
import { BusinessSubscriptionPlans } from '@/features/business-panel/components/BusinessSubscriptionPlans'

export default function BusinessSubscriptionPlansPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Planes de Suscripción</h1>
        <p className="text-carbon-300">Elige el plan que mejor se adapte a las necesidades de tu organización</p>
      </div>
      
      <BusinessSubscriptionPlans />
    </motion.div>
  )
}

