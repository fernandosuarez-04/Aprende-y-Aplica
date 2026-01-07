'use client'

import { motion } from 'framer-motion'
import { BusinessSettings } from '@/features/business-panel/components/BusinessSettings'
import { useTranslation } from 'react-i18next'

export default function BusinessPanelSettingsPage() {
  const { t } = useTranslation('business')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      
      <BusinessSettings />
    </motion.div>
  )
}

