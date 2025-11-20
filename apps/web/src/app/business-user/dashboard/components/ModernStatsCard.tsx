'use client'

import { motion } from 'framer-motion'
import { ElementType, useState } from 'react'
import { AnimatedCounter } from './AnimatedCounter'

interface ModernStatsCardProps {
  label: string
  value: number
  icon: ElementType
  color: string
  index: number
  onClick?: () => void
  isClickable?: boolean
}

export function ModernStatsCard({
  label,
  value,
  icon: Icon,
  color,
  index,
  onClick,
  isClickable = false
}: ModernStatsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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
        bg-white/50 dark:bg-gray-900/50 
        backdrop-blur-sm
        ${colors.border} 
        transition-all duration-300
        ${isClickable ? 'cursor-pointer' : ''}
        ${isHovered && isClickable ? `${colors.bg} border-opacity-40` : ''}
      `}
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
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              {label}
            </p>
            <div className={`text-2xl font-bold ${colors.text}`}>
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
