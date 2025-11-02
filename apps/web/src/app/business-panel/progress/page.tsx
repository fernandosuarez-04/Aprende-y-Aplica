'use client'

import { motion } from 'framer-motion'
import { BusinessTeamProgress } from '@/features/business-panel/components/BusinessTeamProgress'

export default function BusinessPanelProgressPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Progreso del Equipo</h1>
        <p className="text-carbon-300">Visualiza y analiza el avance de aprendizaje</p>
      </div>
      
      <BusinessTeamProgress />
    </motion.div>
  )
}

