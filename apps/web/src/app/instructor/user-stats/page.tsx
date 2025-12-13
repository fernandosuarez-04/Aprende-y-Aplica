'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserStatsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a la ruta correcta
    router.replace('/instructor/stats')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirigiendo a Estadísticas...</p>
      </div>
    </div>
  )
}
