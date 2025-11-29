'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { hexToRgb } from '../utils/styles'

export function PremiumLoadingScreen() {
  const { styles } = useOrganizationStylesContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcular estilos del fondo basados en los estilos personalizados
  const backgroundStyle = {
    backgroundColor: styles?.panel?.sidebar_background || '#0f172a',
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--org-primary-button-color, #3b82f6), transparent)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--org-secondary-button-color, #10b981), transparent)',
          }}
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--org-primary-button-color, rgba(59, 130, 246, 0.1)) 1px, transparent 1px),
              linear-gradient(90deg, var(--org-primary-button-color, rgba(59, 130, 246, 0.1)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Premium Spinner */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-[3px] border-transparent"
            style={{
              borderTopColor: 'var(--org-primary-button-color, #3b82f6)',
              borderRightColor: 'var(--org-secondary-button-color, #10b981)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Middle Ring */}
          <motion.div
            className="absolute inset-2 sm:inset-3 rounded-full border-[3px] border-transparent"
            style={{
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)',
              borderLeftColor: 'var(--org-secondary-button-color, #10b981)',
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Inner Pulsing Circle */}
          <motion.div
            className="absolute inset-4 sm:inset-6 rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Center Dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-lg"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-4">
          <motion.h2
            className="text-xl sm:text-2xl font-semibold tracking-tight"
            style={{
              color: styles?.panel?.text_color || 'rgba(255, 255, 255, 0.95)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Cargando panel de gestión...
          </motion.h2>
          
          {/* Animated Dots */}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2.5 h-2.5 rounded-full shadow-lg"
                style={{
                  backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Progress Indicator */}
        <motion.div
          className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full absolute top-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
              }}
              animate={{
                x: ['-100%', '400%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Particles - Solo renderizar en cliente para evitar hydration mismatch */}
      {mounted && [
        { left: 15, top: 20, delay: 0, xOffset: 5 },
        { left: 85, top: 30, delay: 0.5, xOffset: -8 },
        { left: 25, top: 70, delay: 1, xOffset: 3 },
        { left: 75, top: 60, delay: 1.5, xOffset: -5 },
        { left: 45, top: 15, delay: 0.8, xOffset: 7 },
        { left: 55, top: 85, delay: 1.2, xOffset: -3 },
      ].map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            opacity: 0.3,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}

