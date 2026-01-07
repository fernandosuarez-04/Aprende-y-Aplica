'use client'

import { motion } from 'framer-motion'
import { BusinessAnalytics } from '@/features/business-panel/components/BusinessAnalytics'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useTranslation } from 'react-i18next'

export default function BusinessPanelAnalyticsPage() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const carbon300 = '#cbd5e1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      
      <BusinessAnalytics />
    </motion.div>
  )
}

