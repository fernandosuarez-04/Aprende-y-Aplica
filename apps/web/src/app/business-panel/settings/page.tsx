'use client'

import { motion } from 'framer-motion'
import { BusinessSettings } from '@/features/business-panel/components/BusinessSettings'

export default function BusinessPanelSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Configuración</h1>
        <p className="text-carbon-300">Gestiona las configuraciones de tu organización</p>
      </div>
      
      <BusinessSettings />
    </motion.div>
  )
}

