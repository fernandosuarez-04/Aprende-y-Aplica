'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useLogoEasterEgg() {
  const [clickCount, setClickCount] = useState(0)
  const [isActivated, setIsActivated] = useState(false)
  const router = useRouter()
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dashboardRedirectRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogoClick = useCallback(() => {
    // Limpiar el temporizador anterior si existe
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }
    
    // Cancelar redirección al dashboard si existe
    if (dashboardRedirectRef.current) {
      clearTimeout(dashboardRedirectRef.current)
      dashboardRedirectRef.current = null
    }

    setClickCount(prev => {
      const newCount = prev + 1
      
      // Mostrar feedback discreto en consola
      // console.log(`🥚 ${newCount}/5`)
      
      // Si llega a 5 clics consecutivos, redirigir a easteregg
      if (newCount >= 5) {
        // console.log('🎉 ¡Easter Egg!')
        setIsActivated(true)
        
        // Pequeño delay para el efecto visual
        setTimeout(() => {
          router.push('/easteregg')
          setClickCount(0) // Resetear contador después de redirigir
        }, 500)
        
        return 0 // Resetear contador
      }
      
      // Si es el primer clic, programar redirección a dashboard después de un delay
      // Esto permite que el usuario pueda hacer más clics antes de que se ejecute la redirección
      if (newCount === 1) {
        dashboardRedirectRef.current = setTimeout(() => {
          // Solo redirigir si el contador sigue en 1 (no se incrementó a 5)
          setClickCount(current => {
            if (current === 1) {
              router.push('/dashboard')
              return 0
            }
            return current
          })
          dashboardRedirectRef.current = null
        }, 500) // Delay de 500ms para permitir más clics
      }
      
      // Establecer un temporizador para resetear el contador si no hay otro clic en 500ms
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0)
        // console.log('🔄 Reset - clics no consecutivos')
      }, 500)
      
      return newCount
    })
  }, [router])

  // Resetear estado de activación después de navegar
  useEffect(() => {
    if (isActivated) {
      const timer = setTimeout(() => {
        setIsActivated(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isActivated])

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
      if (dashboardRedirectRef.current) {
        clearTimeout(dashboardRedirectRef.current)
      }
    }
  }, [])

  return {
    clickCount,
    isActivated,
    handleLogoClick
  }
}
