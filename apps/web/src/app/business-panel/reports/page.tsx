'use client'

import { motion } from 'framer-motion'
import { BusinessReports } from '@/features/business-panel/components/BusinessReports'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

export default function BusinessPanelReportsPage() {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-2" style={{ color: textColor }}>
          Reportes
        </h1>
        <p className="text-sm font-body opacity-70" style={{ color: textColor }}>
          Genera reportes detallados y exporta datos
        </p>
      </div>
      
      <BusinessReports />
    </motion.div>
  )
}

