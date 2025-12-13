'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ProgressBar3DProps {
  progress: number
  className?: string
  delay?: number
  showLabel?: boolean
  label?: string
}

export function ProgressBar3D({
  progress,
  className = '',
  delay = 0,
  showLabel = true,
  label
}: ProgressBar3DProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [progress, delay])

  const clampedProgress = Math.min(Math.max(displayProgress, 0), 100)

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-300 text-sm font-medium uppercase tracking-wider">
            {label || 'Progreso'}
          </span>
          <span className="text-primary font-bold text-lg">{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className="relative h-3 bg-carbon-700/50 dark:bg-carbon-800/50 rounded-full overflow-hidden shadow-inner border border-carbon-600/30">
        {/* Base gradient background */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            delay: delay,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="absolute inset-0 h-full bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a] rounded-full shadow-lg shadow-[#00D4B3]/30"
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0.5
            }}
          />
          
          {/* Glow effect on edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/60 via-transparent to-[#00D4B3]/60 rounded-full blur-sm" />
          
          {/* Animated particles */}
          {clampedProgress > 0 && clampedProgress < 100 && (
            <motion.div
              className="absolute top-0 right-0 w-2 h-full bg-white/50 rounded-full blur-sm"
              animate={{
                opacity: [0, 1, 0],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </motion.div>
        
        {/* Progress completion indicator */}
        {clampedProgress === 100 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'back.out' }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
