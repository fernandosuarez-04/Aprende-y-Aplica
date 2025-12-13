'use client'

import { motion } from 'framer-motion'
import { ReactNode, useRef, useState, memo } from 'react'
import { AnimatedCounter } from './AnimatedCounter'

interface StatsCard3DProps {
  label: string
  value: number
  icon: React.ElementType
  gradient: string
  index: number
  onClick?: () => void
  isClickable?: boolean
}

export const StatsCard3D = memo(function StatsCard3D({
  label,
  value,
  icon: Icon,
  gradient,
  index,
  onClick,
  isClickable = false
}: StatsCard3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick()
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        scale: 1.03,
        y: -12,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className={`
        relative group overflow-hidden 
        backdrop-blur-xl 
        bg-gradient-to-br from-carbon-800/95 via-carbon-700/95 to-carbon-800/95 
        rounded-2xl p-7 
        border border-carbon-600/50 
        shadow-2xl shadow-black/30
        transition-all duration-500
        ${isClickable ? 'cursor-pointer' : ''}
        ${isHovered ? 'border-primary/60 shadow-primary/30' : ''}
      `}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0`}
        animate={{
          opacity: isHovered ? 0.12 : 0,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Glow effect */}
      <motion.div
        className={`absolute -top-1/2 -right-1/2 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl`}
        animate={{
          opacity: isHovered ? 0.25 : 0,
          scale: isHovered ? 1.5 : 1,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Border glow */}
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 blur-sm -z-10`}
        animate={{
          opacity: isHovered ? 0.3 : 0,
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
        }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-xl shadow-black/40`}
          animate={{
            rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-8 h-8 text-white drop-shadow-lg" />
        </motion.div>

        {/* Label */}
        <motion.p
          className="text-gray-500 dark:text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wider"
          animate={{
            color: isHovered ? undefined : undefined,
          }}
        >
          {label}
        </motion.p>

        {/* Value with animated counter */}
        <motion.div
          className="text-5xl font-extrabold text-white tracking-tight"
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedCounter
            value={value}
            duration={1.5}
            decimals={0}
            className="block"
          />
        </motion.div>

        {/* Hover indicator */}
        {isClickable && (
          <motion.p
            className="text-gray-400 dark:text-gray-300 text-xs mt-3 font-medium"
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : -5,
            }}
            transition={{ duration: 0.3 }}
          >
            Click para ver →
          </motion.p>
        )}
      </div>

      {/* Floating particles effect */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-br ${gradient} rounded-full opacity-60`}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                opacity: [0.6, 0.8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
})
