'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #1a0b2e 100%)',
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      {/* Loading Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Circular Loading Indicator with Concentric Rings */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          {/* Solid Black Core */}
          <div 
            className="absolute inset-8 sm:inset-10 rounded-full"
            style={{
              backgroundColor: '#000000'
            }}
          />

          {/* Outer Ring - Light Purple (almost complete) */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'rgba(139, 92, 246, 0.6)',
              borderRightColor: 'rgba(139, 92, 246, 0.4)',
              borderBottomColor: 'rgba(139, 92, 246, 0.2)',
              filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Middle Ring - Pink/Magenta */}
          <motion.div
            className="absolute inset-2 sm:inset-3 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'rgba(236, 72, 153, 0.8)',
              borderRightColor: 'rgba(236, 72, 153, 0.6)',
              borderBottomColor: 'rgba(236, 72, 153, 0.3)',
              filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.5))'
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Inner Ring - Orange */}
          <motion.div
            className="absolute inset-4 sm:inset-5 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'rgba(251, 146, 60, 0.9)',
              borderRightColor: 'rgba(251, 146, 60, 0.7)',
              borderBottomColor: 'rgba(251, 146, 60, 0.4)',
              filter: 'drop-shadow(0 0 4px rgba(251, 146, 60, 0.6))'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-white text-lg sm:text-xl font-medium tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Preparando tu experiencia...
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden relative"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, rgb(251, 146, 60), rgb(236, 72, 153))',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Progress Dot */}
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                marginRight: '-6px'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Decorative Star Icon - Bottom Right */}
      <motion.div
        className="absolute bottom-8 right-8 w-4 h-4"
        style={{
          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))'
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      </motion.div>
    </div>
  );
}

