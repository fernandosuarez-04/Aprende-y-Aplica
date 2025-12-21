'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, memo, useMemo } from 'react'
import Image from 'next/image'
import {
  Award,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight
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

  // Colores personalizados de la organización
  const orgColors = useMemo(() => {
    const primary = styles?.primary_button_color || '#0A2540'
    const accent = styles?.accent_color || '#00D4B3'
    const success = '#10B981' // Verde para completado
    const warning = '#F59E0B' // Ámbar para pendiente

    return {
      primary,
      accent,
      success,
      warning,
      // Gradientes usando colores de la organización
      primaryGradient: `linear-gradient(135deg, ${primary}, ${accent})`,
      accentGradient: `linear-gradient(135deg, ${accent}, ${primary})`,
      successGradient: 'linear-gradient(135deg, #10B981, #34D399)',
    }
  }, [styles])

  // Calcular estilos de la tarjeta basados en los estilos personalizados
  const cardStyle = useMemo(() => {
    const cardBg = styles?.card_background || '#1E2329'
    const cardOpacity = styles?.card_opacity !== undefined ? styles.card_opacity : 0.98
    const borderColor = styles?.border_color || 'rgba(255, 255, 255, 0.08)'
    const textColor = styles?.text_color || '#FFFFFF'

    let backgroundColor: string
    if (cardBg.startsWith('#')) {
      const rgb = hexToRgb(cardBg)
      backgroundColor = `rgba(${rgb}, ${cardOpacity})`
    } else {
      backgroundColor = cardBg
    }

    return {
      backgroundColor,
      borderColor,
      textColor
    }
  }, [styles])

  const getStatusConfig = () => {
    switch (course.status) {
      case 'Completado':
        return {
          gradient: orgColors.successGradient,
          glow: 'rgba(16, 185, 129, 0.4)',
          bgColor: 'rgba(16, 185, 129, 0.15)',
          textColor: '#34D399',
          icon: CheckCircle2,
          label: 'Completado'
        }
      case 'En progreso':
        return {
          gradient: orgColors.primaryGradient,
          glow: `${orgColors.accent}60`,
          bgColor: `${orgColors.accent}20`,
          textColor: orgColors.accent,
          icon: PlayCircle,
          label: 'En progreso'
        }
      default:
        return {
          gradient: orgColors.accentGradient,
          glow: `${orgColors.primary}60`,
          bgColor: `${orgColors.primary}20`,
          textColor: orgColors.accent,
          icon: Clock,
          label: 'Asignado'
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
        gradient: orgColors.successGradient,
        glow: 'rgba(16, 185, 129, 0.5)'
      }
    } else if (course.progress === 100) {
      return {
        text: 'Curso Completado',
        icon: CheckCircle2,
        gradient: orgColors.successGradient,
        glow: 'rgba(16, 185, 129, 0.5)'
      }
    } else if (course.progress > 0) {
      return {
        text: 'Continuar Curso',
        icon: PlayCircle,
        gradient: orgColors.primaryGradient,
        glow: `${orgColors.accent}70`
      }
    } else {
      return {
        text: 'Empezar Ahora',
        icon: Sparkles,
        gradient: orgColors.primaryGradient,
        glow: `${orgColors.primary}60`
      }
    }
  }

  const buttonConfig = getButtonConfig()
  const ButtonIcon = buttonConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer backdrop-blur-xl border"
      style={{
        backgroundColor: cardStyle.backgroundColor,
        borderColor: isHovered ? statusConfig.textColor : cardStyle.borderColor,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? `0 25px 50px -12px ${statusConfig.glow}, 0 0 80px -20px ${statusConfig.glow}`
          : '0 4px 25px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: statusConfig.gradient,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
        animate={{ opacity: isHovered ? 1 : 0.2 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
        }}
        animate={{ x: isHovered ? ['100%', '-100%'] : '-100%' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      {/* Corner glow orbs */}
      <motion.div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: statusConfig.textColor }}
        animate={{ opacity: isHovered ? 0.3 : 0.08 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Thumbnail with overlay */}
        <div className="relative overflow-hidden">
          {course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? (
            <div className="relative w-full h-48 overflow-hidden">
              <motion.div
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
              {/* Enhanced overlay gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, 
                    transparent 0%, 
                    rgba(0,0,0,0.2) 50%, 
                    ${cardStyle.backgroundColor} 100%
                  )`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div
              className="relative w-full h-48 overflow-hidden"
              style={{ background: statusConfig.gradient }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-30">{course.thumbnail}</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          )}

          {/* Status Badge - Floating */}
          <motion.div
            className="absolute top-4 right-4 z-20"
            animate={{ y: isHovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-xl border flex items-center gap-1.5"
              style={{
                backgroundColor: statusConfig.bgColor,
                borderColor: `${statusConfig.textColor}40`,
                color: statusConfig.textColor,
                boxShadow: `0 4px 15px ${statusConfig.glow}`
              }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusConfig.label}</span>
            </motion.div>
          </motion.div>

          {/* Progress indicator on thumbnail */}
          {course.progress > 0 && course.progress < 100 && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              <motion.div
                className="h-full"
                style={{ background: statusConfig.gradient }}
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
              />
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title with gradient effect on hover */}
          <motion.h3
            className="text-lg font-bold mb-2 leading-tight line-clamp-2"
            style={{
              color: isHovered ? undefined : cardStyle.textColor,
              background: isHovered ? statusConfig.gradient : undefined,
              WebkitBackgroundClip: isHovered ? 'text' : undefined,
              WebkitTextFillColor: isHovered ? 'transparent' : undefined,
              backgroundClip: isHovered ? 'text' : undefined,
            }}
          >
            {course.title}
          </motion.h3>

          {/* Instructor with icon */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: orgColors.primaryGradient,
                color: '#fff'
              }}
            >
              {course.instructor.charAt(0)}
            </div>
            <p
              className="text-sm opacity-70"
              style={{ color: cardStyle.textColor }}
            >
              {course.instructor}
            </p>
          </div>

          {/* Enhanced Progress Section */}
          <div className="mb-5 mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-medium opacity-60"
                style={{ color: cardStyle.textColor }}
              >
                Progreso
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: statusConfig.textColor }}
              >
                {course.progress}%
              </span>
            </div>
            <ProgressBar3D
              progress={course.progress}
              index={index}
              primaryColor={orgColors.primary}
              accentColor={orgColors.accent}
            />
          </div>

          {/* Action Button with premium styling using org colors */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              if (course.progress === 100 && course.has_certificate && onCertificateClick) {
                onCertificateClick()
              } else {
                onClick()
              }
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-white font-semibold text-sm relative overflow-hidden group/btn"
            style={{
              background: buttonConfig.gradient,
              boxShadow: `0 4px 20px ${buttonConfig.glow}`
            }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.25) 50%, transparent 75%)'
              }}
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />

            {/* Button content */}
            <div className="relative z-10 flex items-center gap-2.5">
              <ButtonIcon className="w-4 h-4" />
              <span>{buttonConfig.text}</span>
              <motion.div
                animate={{ x: isHovered ? 3 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </motion.button>
        </div>

        {/* Sparkles decoration on hover */}
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-16 left-4"
              >
                <Sparkles className="w-4 h-4" style={{ color: statusConfig.textColor }} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute top-8 right-16"
              >
                <Sparkles className="w-3 h-3" style={{ color: statusConfig.textColor }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative corners */}
      <div
        className="absolute top-2 left-2 w-6 h-6 border-t border-l rounded-tl-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: statusConfig.textColor }}
      />
      <div
        className="absolute bottom-2 right-2 w-6 h-6 border-b border-r rounded-br-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: statusConfig.textColor }}
      />
    </motion.div>
  )
})
