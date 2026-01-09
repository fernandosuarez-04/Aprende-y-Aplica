'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function BusinessPanelProgressPage() {
  const { t } = useTranslation('business')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">{t('progress.title')}</h1>
        <p className="text-carbon-300">{t('progress.subtitle')}</p>
      </div>
      
      <div className="text-white p-4 border border-white/10 rounded-lg">
        Sección de progreso de equipos eliminada.
      </div>
    </motion.div>
  )
}

