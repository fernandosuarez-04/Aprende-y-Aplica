'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const countRef = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    if (!countRef.current) return

    // Limpiar animación anterior
    if (animationRef.current) {
      animationRef.current.kill()
    }

    const startValue = 0
    const endValue = value

    // Crear animación con GSAP usando un objeto para el valor numérico
    const obj = { value: startValue }
    
    animationRef.current = gsap.to(obj, {
      value: endValue,
      duration: duration,
      ease: 'power2.out',
      onUpdate: function() {
        if (countRef.current) {
          const formattedValue = obj.value.toFixed(decimals)
          countRef.current.innerHTML = `${prefix}${formattedValue}${suffix}`
        }
      }
    })

    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [value, duration, decimals, prefix, suffix])

  return (
    <span 
      ref={countRef} 
      className={className}
      suppressHydrationWarning
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}
