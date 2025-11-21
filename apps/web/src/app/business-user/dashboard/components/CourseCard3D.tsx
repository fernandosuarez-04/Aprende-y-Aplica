'use client'

import { motion } from 'framer-motion'
import { useState, memo, useMemo } from 'react'
import Image from 'next/image'
import {
  Award,
  CheckCircle2,
  PlayCircle,
  TrendingUp
} from 'lucide-react'
import { ProgressBar3D } from './ProgressBar3D'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'

interface CourseCard3DProps {
  course: {
    id: string
    title: string
    instructor: string
    progress: number
    status: 'Asignado' | 'En progreso' | 'Completado'
    thumbnail: string
    slug?: string
    has_certificate?: boolean
  }
  index: number
  onClick: () => void
  onCertificateClick?: () => void
  styles?: StyleConfig | null
}

export const CourseCard3D = memo(function CourseCard3D({
  course,
  index,
  onClick,
  onCertificateClick,
  styles
}: CourseCard3DProps) {
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

  const getStatusConfig = () => {
    switch (course.status) {
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
    if (course.progress === 100 && course.has_certificate) {
      return {
        text: 'Ver Certificado',
        icon: Award,
        gradient: 'from-green-500 via-emerald-500 to-green-600'
      }
    } else if (course.progress === 100) {
      return {
        text: 'Curso Completado',
        icon: CheckCircle2,
        gradient: 'from-green-500 via-emerald-500 to-green-600'
      }
    } else if (course.progress > 0) {
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
        {/* Header: Thumbnail and Status */}
        <div className="relative">
          {course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? (
            <div className="relative w-full h-48 overflow-hidden">
              <motion.div
                animate={{
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-success/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-20">{course.thumbnail}</div>
              </div>
            </div>
          )}

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
                <span>{course.status}</span>
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
            {course.title}
          </h3>

          {/* Instructor */}
          <p 
            className="text-sm mb-5 opacity-70"
            style={{ color: cardStyle.color || undefined }}
          >
            Por {course.instructor}
          </p>

          {/* Progress Section */}
          <div className="mb-6 mt-auto">
            <ProgressBar3D
              progress={course.progress}
              index={index}
            />
          </div>

          {/* Action Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              if (course.progress === 100 && course.has_certificate && onCertificateClick) {
                onCertificateClick()
              } else {
                onClick()
              }
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
