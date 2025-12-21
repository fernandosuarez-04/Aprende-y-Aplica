'use client'

import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

// Lazy load React Three Fiber components
const Scene3D = lazy(() => import('./Scene3D').then(m => ({ default: m.Scene3D })))

export function Background3DEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Large Gradient Orbs - Premium glow effect */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -60, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      {/* React Three Fiber Scene - Lazy loaded */}
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      {/* Geometric Shapes with Glass Effect - Static (no rotation) */}
      <motion.div
        className="absolute top-1/4 right-[15%] w-32 h-32 rounded-2xl border border-cyan-500/10"
        style={{
          transform: 'rotate(45deg)',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.03), transparent)'
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-[10%] w-24 h-24 rounded-xl border border-emerald-500/10"
        style={{
          transform: 'rotate(-15deg)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), transparent)'
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <motion.div
        className="absolute top-2/3 left-1/3 w-20 h-20 rounded-full border border-purple-500/10"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.02), transparent)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Particles - Subtle movement */}
      {[...Array(8)].map((_, i) => {
        const colors = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B']
        const color = colors[i % colors.length]
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${15 + (i * 10) % 70}%`,
              top: `${20 + (i * 12) % 60}%`,
              width: `${3 + (i % 2) * 2}px`,
              height: `${3 + (i % 2) * 2}px`,
              background: color,
              boxShadow: `0 0 ${6 + i}px ${color}`,
              opacity: 0.3
            }}
            animate={{
              y: [0, -20 - (i % 3) * 8, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        )
      })}

      {/* Connecting Lines - Neural Network Effect */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <motion.line
          x1="10%" y1="20%" x2="40%" y2="60%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.line
          x1="60%" y1="30%" x2="90%" y2="70%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.line
          x1="30%" y1="80%" x2="70%" y2="40%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </svg>

      {/* Static Dot Grid - No animation */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(14, 165, 233, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.2
        }}
      />

      {/* Corner Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.3) 100%)'
        }}
      />
    </div>
  )
}