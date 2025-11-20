'use client'

import { motion } from 'framer-motion'
import { useState, memo } from 'react'
import Image from 'next/image'
import {
  Award,
  CheckCircle2,
  PlayCircle,
  TrendingUp
} from 'lucide-react'
import { ProgressBar3D } from './ProgressBar3D'

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
}

export const CourseCard3D = memo(function CourseCard3D({
  course,
  index,
  onClick,
  onCertificateClick
}: CourseCard3DProps) {
  const [isHovered, setIsHovered] = useState(false)

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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        y: -16,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden 
        backdrop-blur-xl 
        bg-gradient-to-br from-carbon-800/95 via-carbon-700/95 to-carbon-800/95 
        rounded-3xl 
        border border-carbon-600/50 
        hover:border-primary/60 
        transition-all duration-500 
        cursor-pointer 
        shadow-2xl shadow-black/30 
        hover:shadow-2xl hover:shadow-primary/30"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Glow effects */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-64 h-64 bg-success/10 rounded-full blur-3xl"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: isHovered ? ['-100%', '200%'] : '-100%',
        }}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: 'linear',
          repeatDelay: 0.5,
        }}
      />

      <div className="p-8 relative z-10">
        {/* Header with thumbnail and status */}
        <div className="flex items-start justify-between mb-6">
          {course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? (
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-black/40 border-2 border-carbon-600/50 group-hover:border-primary/50 transition-all duration-500"
            >
              <Image
                src={course.thumbnail}
                alt={course.title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center text-4xl shadow-xl shadow-black/40 border-2 border-carbon-600/50 group-hover:border-primary/50 transition-all duration-500"
            >
              {course.thumbnail}
            </motion.div>
          )}

          <motion.div
            className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shadow-lg ${statusConfig.shadow}`}
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{course.status}</span>
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h3
          className="text-2xl font-bold text-white mb-3 leading-tight"
          animate={{
            backgroundImage: isHovered
              ? 'linear-gradient(to right, var(--color-primary), var(--color-success))'
              : 'none',
            WebkitBackgroundClip: isHovered ? 'text' : 'initial',
            WebkitTextFillColor: isHovered ? 'transparent' : 'white',
            backgroundClip: isHovered ? 'text' : 'initial',
          }}
          transition={{ duration: 0.5 }}
        >
          {course.title}
        </motion.h3>

        {/* Instructor */}
        <p className="text-gray-400 dark:text-gray-300 text-base mb-6 font-medium">
          Por {course.instructor}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <ProgressBar3D
            progress={course.progress}
            delay={index * 0.2 + 0.3}
          />
        </div>

        {/* Action button */}
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
            w-full flex items-center justify-center gap-3 
            px-6 py-4 
            bg-gradient-to-r ${buttonConfig.gradient} 
            rounded-xl 
            text-white font-bold text-base 
            shadow-xl shadow-primary/30 
            hover:shadow-2xl hover:shadow-primary/50 
            transition-all duration-500 
            relative overflow-hidden group/btn
          `}
        >
          {/* Button shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/30 to-success/0"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1,
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <ButtonIcon className="w-5 h-5" />
            <span>{buttonConfig.text}</span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
})
