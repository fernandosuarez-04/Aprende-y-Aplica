'use client'

import { useState, useEffect } from 'react'
import { AdminStatsWithChanges } from '../services/adminStats.service'

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStatsWithChanges | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // console.log('🔄 useAdminStats: Iniciando fetch a /api/admin/stats')
        const response = await fetch('/api/admin/stats')
        
        // console.log('📡 useAdminStats: Respuesta recibida:', response.status, response.ok)
        
        if (!response.ok) {
          const errorText = await response.text()
          // console.error('❌ useAdminStats: Error en respuesta:', response.status, response.statusText, errorText)
          throw new Error(`Error al obtener estadísticas: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        // console.log('✅ useAdminStats: Datos recibidos:', data)
        setStats(data)
      } catch (err) {
        // console.error('❌ useAdminStats: Error completo:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading, error }
}
