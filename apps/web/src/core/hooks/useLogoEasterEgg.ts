'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useLogoEasterEgg() {
  const [clickCount, setClickCount] = useState(0)
  const [isActivated, setIsActivated] = useState(false)
  const router = useRouter()

  const handleLogoClick = useCallback(() => {
    if (isActivated) return // Evitar múltiples activaciones
    
    setClickCount(prev => {
      const newCount = prev + 1
      
      // Mostrar feedback discreto en consola
      // console.log(`🥚 ${newCount}/5`)
      
      if (newCount >= 5) {
        // console.log('🎉 ¡Easter Egg!')
        setIsActivated(true)
        
        // Pequeño delay para el efecto visual
        setTimeout(() => {
          router.push('/credits')
        }, 500)
        
        return 0 // Resetear contador
      }
      
      return newCount
    })
  }, [isActivated, router])

  // Resetear contador después de 3 segundos de inactividad
  useEffect(() => {
    if (clickCount > 0 && !isActivated) {
      const timer = setTimeout(() => {
        setClickCount(0)
        // console.log('🔄 Reset')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [clickCount, isActivated])

  // Resetear estado de activación después de navegar
  useEffect(() => {
    if (isActivated) {
      const timer = setTimeout(() => {
        setIsActivated(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isActivated])

  return {
    clickCount,
    isActivated,
    handleLogoClick
  }
}
