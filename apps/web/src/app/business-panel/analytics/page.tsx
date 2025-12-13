'use client'

import { motion } from 'framer-motion'
import { BusinessAnalytics } from '@/features/business-panel/components/BusinessAnalytics'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

export default function BusinessPanelAnalyticsPage() {
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-3" style={{ color: textColor }}>
          Analytics
        </h1>
        <p className="font-body" style={{ color: panelStyles?.text_color ? `${textColor}CC` : carbon300 }}>
          Analíticas detalladas de comportamiento y rendimiento
        </p>
      </div>
      
      <BusinessAnalytics />
    </motion.div>
  )
}

