'use client'

import { useState, useEffect } from 'react'
import { 
  InstructorReelsService, 
  InstructorReel, 
  InstructorReelStats, 
  CreateReelData, 
  UpdateReelData 
} from '../services/instructorReels.service'

export function useInstructorReels() {
  const [reels, setReels] = useState<InstructorReel[]>([])
  const [stats, setStats] = useState<InstructorReelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReels = async () => {
    try {
      setLoading(true)
      setError(null)
      const [reelsData, statsData] = await Promise.all([
        InstructorReelsService.getReels(),
        InstructorReelsService.getStats()
      ])
      setReels(reelsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createReel = async (data: CreateReelData) => {
    try {
      const newReel = await InstructorReelsService.createReel(data)
      setReels(prev => [newReel, ...prev])
      
      // Actualizar estadísticas
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalReels: prev.totalReels + 1,
          activeReels: data.is_active ? prev.activeReels + 1 : prev.activeReels,
          featuredReels: data.is_featured ? prev.featuredReels + 1 : prev.featuredReels
        } : null)
      }
      
      return newReel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reel')
      throw err
    }
  }

  const updateReel = async (id: string, data: UpdateReelData) => {
    try {
      const updatedReel = await InstructorReelsService.updateReel(id, data)
      setReels(prev => prev.map(reel => 
        reel.id === id ? updatedReel : reel
      ))
      return updatedReel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar reel')
      throw err
    }
  }

  const deleteReel = async (id: string) => {
    try {
      await InstructorReelsService.deleteReel(id)
      setReels(prev => prev.filter(reel => reel.id !== id))
      
      // Actualizar estadísticas
      if (stats) {
        const deletedReel = reels.find(reel => reel.id === id)
        if (deletedReel) {
          setStats(prev => prev ? {
            ...prev,
            totalReels: prev.totalReels - 1,
            activeReels: deletedReel.is_active ? prev.activeReels - 1 : prev.activeReels,
            featuredReels: deletedReel.is_featured ? prev.featuredReels - 1 : prev.featuredReels,
            totalViews: prev.totalViews - deletedReel.view_count,
            totalLikes: prev.totalLikes - deletedReel.like_count,
            totalShares: prev.totalShares - deletedReel.share_count,
            totalComments: prev.totalComments - deletedReel.comment_count
          } : null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar reel')
      throw err
    }
  }

  const toggleReelStatus = async (id: string) => {
    try {
      const updatedReel = await InstructorReelsService.toggleReelStatus(id)
      setReels(prev => prev.map(reel => 
        reel.id === id ? updatedReel : reel
      ))
      
      // Actualizar estadísticas
      if (stats) {
        const oldReel = reels.find(reel => reel.id === id)
        if (oldReel) {
          setStats(prev => prev ? {
            ...prev,
            activeReels: updatedReel.is_active ? prev.activeReels + 1 : prev.activeReels - 1
          } : null)
        }
      }
      
      return updatedReel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado del reel')
      throw err
    }
  }

  const toggleReelFeatured = async (id: string) => {
    try {
      const updatedReel = await InstructorReelsService.toggleReelFeatured(id)
      setReels(prev => prev.map(reel => 
        reel.id === id ? updatedReel : reel
      ))
      
      // Actualizar estadísticas
      if (stats) {
        const oldReel = reels.find(reel => reel.id === id)
        if (oldReel) {
          setStats(prev => prev ? {
            ...prev,
            featuredReels: updatedReel.is_featured ? prev.featuredReels + 1 : prev.featuredReels - 1
          } : null)
        }
      }
      
      return updatedReel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar destacado del reel')
      throw err
    }
  }

  useEffect(() => {
    fetchReels()
  }, [])

  return {
    reels,
    stats,
    loading,
    error,
    createReel,
    updateReel,
    deleteReel,
    toggleReelStatus,
    toggleReelFeatured,
    refetch: fetchReels
  }
}

