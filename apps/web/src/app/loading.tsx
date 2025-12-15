'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#0F1419]">
      {/* Loading Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Circular Loading Indicator with SOFIA colors */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          {/* Solid Core */}
          <div className="absolute inset-8 sm:inset-10 rounded-full bg-[#0A2540]/10 dark:bg-[#0A2540]/20" />

          {/* Outer Ring - SOFIA Aqua */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '3px solid transparent',
              borderTopColor: '#00D4B3',
              borderRightColor: 'rgba(0, 212, 179, 0.4)',
              borderBottomColor: 'rgba(0, 212, 179, 0.2)',
              filter: 'drop-shadow(0 0 8px rgba(0, 212, 179, 0.4))'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Middle Ring - SOFIA Deep Blue */}
          <motion.div
            className="absolute inset-2 sm:inset-3 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#0A2540',
              borderRightColor: 'rgba(10, 37, 64, 0.6)',
              borderBottomColor: 'rgba(10, 37, 64, 0.3)',
              filter: 'drop-shadow(0 0 6px rgba(10, 37, 64, 0.3))'
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-[#0A2540] dark:text-white text-lg sm:text-xl font-medium tracking-tight"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Preparando tu experiencia...
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden relative bg-[#E9ECEF] dark:bg-[#1E2329]"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, #00D4B3, #0A2540)',
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
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00D4B3]"
              style={{
                boxShadow: '0 0 8px rgba(0, 212, 179, 0.8)',
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
    </div>
  );
}

