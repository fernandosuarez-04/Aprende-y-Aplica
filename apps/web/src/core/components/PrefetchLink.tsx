'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ComponentProps, useCallback } from 'react'

interface PrefetchLinkProps extends ComponentProps<typeof Link> {
  /**
   * Estrategia de prefetch
   * - 'hover': Prefetch al hacer hover (por defecto)
   * - 'immediate': Prefetch inmediato
   * - 'viewport': Prefetch cuando entra en el viewport
   */
  prefetchStrategy?: 'hover' | 'immediate' | 'viewport'
}

/**
 * Link mejorado con prefetch inteligente
 * Mejora la navegación precargando rutas estratégicamente
 */
export function PrefetchLink({ 
  prefetchStrategy = 'hover',
  children,
  href,
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter()
  
  const handleMouseEnter = useCallback(() => {
    if (prefetchStrategy === 'hover' && typeof href === 'string') {
      router.prefetch(href)
    }
  }, [prefetchStrategy, href, router])

  return (
    <Link 
      href={href}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  )
}
