'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import useSWR from 'swr'
import { Notification } from '../services/notification.service'

/**
 * Interfaz para el contexto de notificaciones
 */
interface NotificationContextType {
  // Datos
  notifications: Notification[]
  unreadCount: number
  criticalCount: number
  highCount: number
  
  // Estado
  isLoading: boolean
  error: Error | null
  
  // Acciones
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveNotification: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  
  // Estado del dropdown
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
}

/**
 * Contexto de notificaciones
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface NotificationProviderProps {
  children: ReactNode
  /**
   * Intervalo de polling en milisegundos (default: 30000 = 30 segundos)
   * Set a 0 para desactivar polling automático
   */
  pollingInterval?: number
}

/**
 * Provider de notificaciones global
 *
 * ✅ OPTIMIZACIÓN: Polling reducido de 30s a 60s
 * ✅ OPTIMIZACIÓN: Deduping aumentado de 2s a 5s
 * ✅ FIX: Revalidación siempre activa para mantener datos actualizados
 * ✅ FIX: Revalidación inicial al montar para cargar datos frescos
 *
 * Proporciona acceso a notificaciones en toda la aplicación
 * Usa SWR para cache y revalidación automática
 */
export function NotificationProvider({
  children,
  pollingInterval = 60000  // ✅ OPTIMIZACIÓN: De 30s a 60s (50% menos requests)
}: NotificationProviderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Marcar como montado después del primer render
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Obtener notificaciones no leídas
  const {
    data: notificationsData,
    error: notificationsError,
    mutate: mutateNotifications,
    isLoading: isLoadingNotifications
  } = useSWR<{ success: boolean; data: { notifications: Notification[]; total: number } }>(
    isMounted ? '/api/notifications?status=unread&limit=10&orderBy=priority' : null,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: true,  // ✅ Siempre revalidar en focus para mantener datos actualizados
      revalidateOnReconnect: true,
      dedupingInterval: 5000,  // ✅ De 2s a 5s para evitar requests duplicados
      revalidateIfStale: true,  // ✅ Revalidar si data está stale (importante para carga inicial)
    }
  )

  // Obtener conteo de no leídas
  const {
    data: countData,
    error: countError,
    mutate: mutateCount
  } = useSWR<{ success: boolean; data: { total: number; critical: number; high: number } }>(
    isMounted ? '/api/notifications/unread-count' : null,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: true,  // ✅ Siempre revalidar en focus para mantener datos actualizados
      revalidateOnReconnect: true,
      dedupingInterval: 5000,  // ✅ De 2s a 5s
      revalidateIfStale: true,  // ✅ Revalidar si data está stale (importante para carga inicial)
    }
  )

  // Extraer datos
  const notifications = notificationsData?.data?.notifications || []
  const unreadCount = countData?.data?.total || 0
  const criticalCount = countData?.data?.critical || 0
  const highCount = countData?.data?.high || 0

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      // console.error('Error marcando notificación como leída:', error)
      throw error
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      // console.error('Error marcando todas como leídas:', error)
      throw error
    }
  }

  // Archivar notificación
  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al archivar notificación')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      // console.error('Error archivando notificación:', error)
      throw error
    }
  }

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar notificación')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      // console.error('Error eliminando notificación:', error)
      throw error
    }
  }

  // Refrescar notificaciones manualmente
  const refreshNotifications = async () => {
    await Promise.all([
      mutateNotifications(),
      mutateCount()
    ])
  }

  // Forzar revalidación inicial al montar
  useEffect(() => {
    if (isMounted) {
      // Revalidar inmediatamente al montar para asegurar datos frescos
      mutateNotifications()
      mutateCount()
    }
  }, [isMounted, mutateNotifications, mutateCount])

  // Escuchar evento personalizado para refrescar notificaciones
  useEffect(() => {
    const handleRefresh = async () => {
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    }

    window.addEventListener('refresh-notifications', handleRefresh)
    
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh)
    }
  }, [mutateNotifications, mutateCount])

  // Determinar si hay error
  const error = notificationsError || countError || null

  // Determinar si está cargando
  const isLoading = isLoadingNotifications

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    criticalCount,
    highCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications,
    isDropdownOpen,
    setIsDropdownOpen
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * Hook para usar el contexto de notificaciones
 * 
 * @throws Error si se usa fuera del NotificationProvider
 */
export function useNotifications() {
  const context = useContext(NotificationContext)
  
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  
  return context
}

