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
        
        const response = await fetch('/api/admin/stats')
        
        if (!response.ok) {
          throw new Error('Error al obtener estadísticas')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching admin stats:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading, error }
}
