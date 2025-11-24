'use client'

import { motion } from 'framer-motion'
import { BusinessAnalytics } from '@/features/business-panel/components/BusinessAnalytics'

export default function BusinessPanelAnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Analytics</h1>
        <p className="text-carbon-300">Analíticas detalladas de comportamiento y rendimiento</p>
      </div>
      
      <BusinessAnalytics />
    </motion.div>
  )
}

