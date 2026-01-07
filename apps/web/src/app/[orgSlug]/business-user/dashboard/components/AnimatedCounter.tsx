'use client'

interface AnimatedCounterProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * Simplified AnimatedCounter - Renders value directly without GSAP animation
 * for better performance
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  return (
    <span className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}
