'use client'

import { motion } from 'framer-motion'
import { BusinessReports } from '@/features/business-panel/components/BusinessReports'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useTranslation } from 'react-i18next'

export default function BusinessPanelReportsPage() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      
      <BusinessReports />
    </motion.div>
  )
}

