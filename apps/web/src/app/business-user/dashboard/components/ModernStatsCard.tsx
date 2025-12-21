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

  // Mapeo de colores con diseño glassmorphism premium
  const colorConfig = useMemo(() => {
    const configs: Record<string, {
      primary: string,
      secondary: string,
      glow: string,
      gradient: string,
      bgGradient: string,
      borderColor: string
    }> = {
      'from-blue-500 to-cyan-500': {
        primary: '#0EA5E9',
        secondary: '#06B6D4',
        glow: 'rgba(14, 165, 233, 0.4)',
        gradient: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
        bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.08))',
        borderColor: 'rgba(14, 165, 233, 0.25)'
      },
      'from-purple-500 to-pink-500': {
        primary: '#8B5CF6',
        secondary: '#D946EF',
        glow: 'rgba(139, 92, 246, 0.4)',
        gradient: 'linear-gradient(135deg, #8B5CF6, #D946EF)',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(217, 70, 239, 0.08))',
        borderColor: 'rgba(139, 92, 246, 0.25)'
      },
      'from-green-500 to-emerald-500': {
        primary: '#10B981',
        secondary: '#34D399',
        glow: 'rgba(16, 185, 129, 0.4)',
        gradient: 'linear-gradient(135deg, #10B981, #34D399)',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.08))',
        borderColor: 'rgba(16, 185, 129, 0.25)'
      },
      'from-orange-500 to-red-500': {
        primary: '#F59E0B',
        secondary: '#EF4444',
        glow: 'rgba(245, 158, 11, 0.4)',
        gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
        bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.08))',
        borderColor: 'rgba(245, 158, 11, 0.25)'
      }
    }
    return configs[color] || configs['from-blue-500 to-cyan-500']
  }, [color])

  // Calcular estilos de la tarjeta basados en los estilos personalizados
  const cardStyle = useMemo(() => {
    const textColor = styles?.text_color || '#FFFFFF'
    return { textColor }
  }, [styles])

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 80,
        damping: 15
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        relative group overflow-hidden rounded-2xl
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.9), rgba(20, 30, 40, 0.85))',
        border: `1px solid ${isHovered ? colorConfig.borderColor : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isHovered
          ? `0 20px 40px -12px ${colorConfig.glow}, 0 0 0 1px ${colorConfig.borderColor}`
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Gradient background overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: colorConfig.bgGradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.3 }}
        transition={{ duration: 0.4 }}
      />

      {/* Decorative glow orb */}
      <motion.div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${colorConfig.primary}20, transparent 70%)`
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          opacity: isHovered ? 0.8 : 0.4
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Content Container */}
      <div className="relative z-10 p-6">
        {/* Top row: Label and Icon */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container - Premium glass design */}
          <motion.div
            className="p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${colorConfig.primary}20, ${colorConfig.secondary}10)`,
              border: `1px solid ${colorConfig.primary}30`,
              boxShadow: `0 4px 15px ${colorConfig.primary}15`
            }}
            animate={{
              boxShadow: isHovered
                ? `0 8px 25px ${colorConfig.glow}`
                : `0 4px 15px ${colorConfig.primary}15`
            }}
            transition={{ duration: 0.3 }}
          >
            <Icon
              className="h-6 w-6"
              style={{
                color: colorConfig.primary,
                filter: `drop-shadow(0 0 8px ${colorConfig.primary}50)`
              }}
            />
          </motion.div>

          {/* Visual indicator for clickable cards */}
          {isClickable && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
              style={{
                background: `${colorConfig.primary}15`,
                color: colorConfig.primary,
                border: `1px solid ${colorConfig.primary}20`
              }}
              animate={{ opacity: isHovered ? 1 : 0.6 }}
              transition={{ duration: 0.2 }}
            >
              <span>Ver más</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Stats section */}
        <div className="space-y-1">
          {/* Label */}
          <motion.p
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            {label}
          </motion.p>

          {/* Value - Large and prominent */}
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
          >
            <span
              className="text-4xl font-bold tracking-tight"
              style={{
                background: colorConfig.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: isHovered ? `drop-shadow(0 0 12px ${colorConfig.glow})` : 'none',
                transition: 'filter 0.3s ease'
              }}
            >
              <AnimatedCounter
                value={value}
                duration={1.2}
                decimals={0}
              />
            </span>
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: colorConfig.gradient,
          opacity: 0.6
        }}
        animate={{
          opacity: isHovered ? 1 : 0.6,
          scaleX: isHovered ? 1 : 0.5
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Subtle inner glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${colorConfig.primary}10`
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}
