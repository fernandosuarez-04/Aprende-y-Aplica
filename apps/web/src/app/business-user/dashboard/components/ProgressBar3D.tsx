'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ProgressBar3DProps {
  progress: number
  index?: number
  className?: string
  primaryColor?: string
  accentColor?: string
}

export function ProgressBar3D({
  progress,
  index = 0,
  className = '',
  primaryColor = '#0A2540',
  accentColor = '#00D4B3'
}: ProgressBar3DProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
      setTimeout(() => setIsAnimating(false), 1500)
    }, index * 100)

    return () => clearTimeout(timer)
  }, [progress, index])

  const clampedProgress = Math.min(Math.max(displayProgress, 0), 100)

  // Dynamic gradient based on progress using org colors
  const getProgressGradient = () => {
    if (clampedProgress === 100) {
      return 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)' // Verde para completado
    } else if (clampedProgress >= 50) {
      return `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${accentColor}CC)`
    } else if (clampedProgress > 0) {
      return `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
    }
    return 'linear-gradient(90deg, #6B7280, #9CA3AF)'
  }

  const getGlowColor = () => {
    if (clampedProgress === 100) return 'rgba(16, 185, 129, 0.5)'
    if (clampedProgress >= 50) return `${accentColor}60`
    if (clampedProgress > 0) return `${primaryColor}50`
    return 'rgba(107, 114, 128, 0.3)'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Background track */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            delay: index * 0.08,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: getProgressGradient(),
            boxShadow: `0 0 20px ${getGlowColor()}`
          }}
        >
          {/* Shine sweep effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear'
            }}
          />

          {/* Glow on the leading edge */}
          {clampedProgress > 0 && clampedProgress < 100 && (
            <motion.div
              className="absolute top-0 right-0 w-3 h-full rounded-full blur-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
              animate={{
                opacity: isAnimating ? [0.3, 1, 0.3] : 0.5,
                scale: isAnimating ? [1, 1.3, 1] : 1
              }}
              transition={{
                duration: 1,
                repeat: isAnimating ? Infinity : 0,
                ease: 'easeInOut'
              }}
            />
          )}
        </motion.div>

        {/* Completion celebration effect */}
        {clampedProgress === 100 && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </>
        )}

        {/* Subtle notches/markers */}
        <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-px h-full bg-white/30"
              style={{ opacity: i === 0 ? 0 : 1 }}
            />
          ))}
        </div>
      </div>

      {/* Edge decorations */}
      <motion.div
        className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
        style={{ backgroundColor: clampedProgress > 0 ? accentColor : 'transparent' }}
        animate={{ scale: clampedProgress > 0 ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
        style={{
          backgroundColor: clampedProgress === 100 ? '#10B981' : 'transparent',
          boxShadow: clampedProgress === 100 ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
        }}
        animate={{ scale: clampedProgress === 100 ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  )
}
