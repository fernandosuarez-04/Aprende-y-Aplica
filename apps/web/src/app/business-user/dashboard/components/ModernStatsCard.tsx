'use client'

import React from 'react'

interface ModernStatsCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  index: number
  onClick?: () => void
  isClickable?: boolean
  styles?: any
  id?: string
}

/**
 * ModernStatsCard - Simplified stats card without heavy animations
 * Uses CSS transitions instead of Framer Motion for better performance
 */
export function ModernStatsCard({
  label,
  value,
  icon: Icon,
  color,
  index,
  onClick,
  isClickable,
  styles,
  id
}: ModernStatsCardProps) {
  const primaryColor = styles?.primary_button_color || '#0A2540'
  const accentColor = styles?.accent_color || '#00D4B3'

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-5
        border border-white/10 backdrop-blur-xl
        transition-all duration-300 scroll-mt-24
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] hover:border-white/20' : ''}
      `}
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}10)`,
              border: `1px solid ${accentColor}30`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        </div>
        
        <p className="text-3xl font-bold text-white mb-1">
          {value}
        </p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>

      {/* Border gradient */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30, transparent, ${accentColor}15)`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />
    </div>
  )
}
