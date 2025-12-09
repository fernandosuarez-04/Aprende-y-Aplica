'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function NewCoursePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir inmediatamente a la página de talleres
    // Los cursos se gestionan como talleres en esta plataforma
    router.replace('/instructor/workshops')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-purple-300 text-lg font-medium">Redirigiendo a la página de talleres...</p>
      </div>
    </div>
  )
}
