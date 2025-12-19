'use client'

import { motion } from 'framer-motion'
import { useState, memo, useMemo } from 'react'
import {
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  Package,
  Target
} from 'lucide-react'
import { ProgressBar3D } from './ProgressBar3D'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'

interface ScormCard3DProps {
  package_: {
    id: string
    title: string
    description?: string
    version: 'SCORM_1.2' | 'SCORM_2004'
    progress: number
    status: 'Asignado' | 'En progreso' | 'Completado'
    thumbnail?: string
    objectives_count: number
  }
  index: number
  onClick: () => void
  styles?: StyleConfig | null
}

export const ScormCard3D = memo(function ScormCard3D({
  package_,
  index,
  onClick,
  styles
}: ScormCard3DProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Calcular estilos de la tarjeta basados en los estilos personalizados
  const cardStyle = useMemo(() => {
    if (!styles) {
      return {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        color: undefined as string | undefined
      }
    }

    const cardBg = styles.card_background || '#1e293b'
    const cardOpacity = styles.card_opacity !== undefined ? styles.card_opacity : 0.95
    const borderColor = styles.border_color || 'rgba(71, 85, 105, 0.5)'
    const textColor = styles.text_color

    // Convertir hex a rgba si es necesario
    let backgroundColor: string
    if (cardBg.startsWith('#')) {
      const rgb = hexToRgb(cardBg)
      backgroundColor = `rgba(${rgb}, ${cardOpacity})`
    } else if (cardBg.startsWith('rgba')) {
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

  const getStatusConfig = () => {
    switch (package_.status) {
      case 'Completado':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-300',
          border: 'border-green-500/30',
          shadow: 'shadow-green-500/20',
          icon: CheckCircle2
        }
      case 'En progreso':
        return {
          bg: 'bg-primary/20',
          text: 'text-primary',
          border: 'border-primary/30',
          shadow: 'shadow-primary/20',
          icon: PlayCircle
        }
      default:
        return {
          bg: 'bg-carbon-600/50',
          text: 'text-gray-300 dark:text-gray-200',
          border: 'border-carbon-500/30',
          shadow: '',
          icon: TrendingUp
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const getButtonConfig = () => {
    if (package_.progress === 100) {
      return {
        text: 'Curso Completado',
        icon: CheckCircle2,
        gradient: 'from-green-500 via-emerald-500 to-green-600'
      }
    } else if (package_.progress > 0) {
      return {
        text: 'Continuar Curso',
        icon: PlayCircle,
        gradient: 'from-primary via-blue-500 to-success'
      }
    } else {
      return {
        text: 'Empezar Curso',
        icon: TrendingUp,
        gradient: 'from-primary via-blue-500 to-success'
      }
    }
  }

  const buttonConfig = getButtonConfig()
  const ButtonIcon = buttonConfig.icon

  // Versión SCORM badge color
  const versionBadgeColor = package_.version === 'SCORM_2004'
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative overflow-hidden
        rounded-xl
        border
        backdrop-blur-sm
        transition-all duration-300
        cursor-pointer
        shadow-lg
        hover:shadow-xl hover:border-primary/40"
      style={{
        backgroundColor: cardStyle.backgroundColor,
        borderColor: cardStyle.borderColor,
        color: cardStyle.color
      }}
    >
      {/* Subtle hover gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.3 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Thumbnail/Icon and Status */}
        <div className="relative">
          <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-success/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              {package_.thumbnail && package_.thumbnail.length <= 4 ? (
                <div className="text-6xl opacity-40">{package_.thumbnail}</div>
              ) : (
                <Package className="w-16 h-16 opacity-30 text-white" />
              )}
            </div>

            {/* SCORM Version Badge - Top Left */}
            <div className="absolute top-4 left-4">
              <motion.div
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${versionBadgeColor} shadow-lg`}
                animate={{
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {package_.version.replace('_', ' ')}
              </motion.div>
            </div>
          </div>

          {/* Status Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <motion.div
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shadow-lg`}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-1.5">
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{package_.status}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title */}
          <h3
            className="text-xl font-bold mb-2 leading-tight line-clamp-2"
            style={{
              color: cardStyle.color || undefined,
              backgroundImage: isHovered
                ? 'linear-gradient(to right, #3b82f6, #10b981)'
                : undefined,
              WebkitBackgroundClip: isHovered ? 'text' : undefined,
              WebkitTextFillColor: isHovered ? 'transparent' : undefined,
              backgroundClip: isHovered ? 'text' : undefined,
            }}
          >
            {package_.title}
          </h3>

          {/* Description or Objectives */}
          <div
            className="text-sm mb-5 opacity-70 flex items-center gap-2"
            style={{ color: cardStyle.color || undefined }}
          >
            {package_.objectives_count > 0 ? (
              <>
                <Target className="w-4 h-4" />
                <span>{package_.objectives_count} objetivos de aprendizaje</span>
              </>
            ) : package_.description ? (
              <span className="line-clamp-1">{package_.description}</span>
            ) : (
              <span>Curso SCORM interactivo</span>
            )}
          </div>

          {/* Progress Section */}
          <div className="mb-6 mt-auto">
            <ProgressBar3D
              progress={package_.progress}
              index={index}
            />
          </div>

          {/* Action Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full flex items-center justify-center gap-2.5
              px-5 py-3.5
              bg-gradient-to-r ${buttonConfig.gradient}
              rounded-lg
              text-white font-semibold text-sm
              shadow-lg
              hover:shadow-xl
              transition-all duration-300
              relative overflow-hidden
            `}
          >
            {/* Subtle shine on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.6 }}
            />

            <div className="relative z-10 flex items-center gap-2.5">
              <ButtonIcon className="w-4 h-4" />
              <span>{buttonConfig.text}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})
