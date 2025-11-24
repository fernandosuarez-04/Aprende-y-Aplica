'use client'

import { motion } from 'framer-motion'
import { ElementType, useState, useMemo } from 'react'
import { AnimatedCounter } from './AnimatedCounter'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'

interface ModernStatsCardProps {
  label: string
  value: number
  icon: ElementType
  color: string
  index: number
  onClick?: () => void
  isClickable?: boolean
  styles?: StyleConfig | null
}

export function ModernStatsCard({
  label,
  value,
  icon: Icon,
  color,
  index,
  onClick,
  isClickable = false,
  styles
}: ModernStatsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Calcular estilos de la tarjeta basados en los estilos personalizados
  const cardStyle = useMemo(() => {
    if (!styles) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: 'rgba(229, 231, 235, 0.2)',
        color: undefined as string | undefined
      }
    }

    const cardBg = styles.card_background || '#1e293b'
    const cardOpacity = styles.card_opacity !== undefined ? styles.card_opacity : 0.95
    const borderColor = styles.border_color || 'rgba(229, 231, 235, 0.2)'
    const textColor = styles.text_color

    // Convertir hex a rgba si es necesario
    let backgroundColor: string
    if (cardBg.startsWith('#')) {
      const rgb = hexToRgb(cardBg)
      backgroundColor = `rgba(${rgb}, ${cardOpacity})`
    } else if (cardBg.startsWith('rgba')) {
      // Si ya es rgba, extraer el valor de opacidad y reemplazarlo
      const rgbaMatch = cardBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${cardOpacity})`
        } else {
          backgroundColor = cardBg
        }
      } else {
        backgroundColor = cardBg
      }
    } else {
      backgroundColor = cardBg
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor
    }
  }, [styles])

  const colorClasses = {
    'from-blue-500 to-cyan-500': {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      border: 'border-blue-500/20 dark:border-blue-500/30',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    'from-purple-500 to-pink-500': {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      border: 'border-purple-500/20 dark:border-purple-500/30',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400'
    },
    'from-green-500 to-emerald-500': {
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      border: 'border-green-500/20 dark:border-green-500/30',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    'from-orange-500 to-red-500': {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      border: 'border-orange-500/20 dark:border-orange-500/30',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-600 dark:text-orange-400'
    }
  }

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses['from-blue-500 to-cyan-500']

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
        ease: 'easeOut'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        relative group rounded-xl border p-5 
        backdrop-blur-sm
        ${colors.border} 
        transition-all duration-300
        ${isClickable ? 'cursor-pointer' : ''}
        ${isHovered && isClickable ? `${colors.bg} border-opacity-40` : ''}
      `}
      style={{
        backgroundColor: cardStyle.backgroundColor,
        borderColor: cardStyle.borderColor,
        color: cardStyle.color
      }}
    >
      {/* Hover effect */}
      {isHovered && isClickable && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colors.bg} -z-10`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon and Label */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p 
              className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70"
              style={{ color: cardStyle.color || undefined }}
            >
              {label}
            </p>
            <div 
              className={`text-2xl font-bold ${colors.text}`}
              style={{ color: cardStyle.color || undefined }}
            >
              <AnimatedCounter
                value={value}
                duration={1.2}
                decimals={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      {isClickable && isHovered && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <div className={`h-1.5 w-1.5 rounded-full ${colors.bg.replace('/10', '/40')}`} />
        </motion.div>
      )}
    </motion.div>
  )
}
