'use client'

import { motion } from 'framer-motion'

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
      
      <div className="grid gap-6">
        <div className="bg-gradient-to-r from-carbon-700 to-carbon-800 rounded-xl p-8 border border-carbon-600">
          <p className="text-center text-carbon-300">Próximamente: Configuración de organización</p>
        </div>
      </div>
    </motion.div>
  )
}

