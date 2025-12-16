'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Archive, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { getNotificationIcon, getNotificationBorderColor, getNotificationBgColor, getNotificationTextColor } from '@/features/notifications/utils/notification-categories'
import { Notification } from '@/features/notifications/services/notification.service'

const NOTIFICATIONS_PER_PAGE = 10

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all')

  // Cargar notificaciones
  const loadNotifications = async (reset: boolean = false) => {
    try {
      setIsLoading(true)
      const currentOffset = reset ? 0 : offset
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`
      
      const response = await fetch(
        `/api/notifications?limit=${NOTIFICATIONS_PER_PAGE}&offset=${currentOffset}&orderBy=created_at&orderDirection=desc${statusParam}`,
        {
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        const newNotifications = data.data.notifications || []
        if (reset) {
          setNotifications(newNotifications)
          setOffset(newNotifications.length)
        } else {
          setNotifications([...notifications, ...newNotifications])
          setOffset(offset + newNotifications.length)
        }
        setHasMore(data.data.hasMore || false)
        setTotal(data.data.total || 0)
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar notificaciones al montar y cuando cambia el filtro
  React.useEffect(() => {
    // Resetear offset cuando cambia el filtro
    setOffset(0)
    setNotifications([])
    loadNotifications(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // Marcar como leída
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.notification_id === notificationId 
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        ))
        // Disparar evento para actualizar el contador en el navbar
        window.dispatchEvent(new Event('refresh-notifications'))
      }
    } catch (error) {
      console.error('Error marcando como leída:', error)
    }
  }

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true)
      
      // Hacer la petición para marcar todas como leídas
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error en respuesta del servidor:', errorData)
        alert(`Error: ${errorData.error || 'No se pudieron marcar todas las notificaciones como leídas'}`)
        return
      }

      const data = await response.json()
      
      if (!data.success) {
        console.error('Error en la operación:', data.error)
        alert(`Error: ${data.error || 'No se pudieron marcar todas las notificaciones como leídas'}`)
        return
      }

      // Si llegamos aquí, la operación fue exitosa
      const updatedCount = data.data?.updated || 0

      // Optimización: Actualizar estado según el filtro actual
      if (statusFilter === 'unread') {
        // Si estábamos viendo solo no leídas, cambiar a "all" para ver todas (ahora todas leídas)
        // Esto evita hacer una consulta adicional innecesaria
        setStatusFilter('all')
        // El useEffect se encargará de recargar con el nuevo filtro automáticamente
      } else if (statusFilter === 'all') {
        // Si estamos viendo todas, actualizar el estado local de las notificaciones cargadas
        setNotifications(notifications.map(n => 
          n.status === 'unread' 
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        ))
        // El total no cambia (todas las notificaciones siguen existiendo, solo cambió su estado)
        // Solo recargar si hay más notificaciones que las cargadas para asegurar consistencia
        if (total > notifications.length) {
          await loadNotifications(true)
        }
      } else {
        // Para "read" o "archived", recargar para reflejar los cambios
        await loadNotifications(true)
      }
      
      // Disparar evento para actualizar el contador en el navbar
      window.dispatchEvent(new Event('refresh-notifications'))
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
      alert('Error al marcar todas las notificaciones como leídas. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Archivar
  const handleArchive = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.notification_id !== notificationId))
        // Disparar evento para actualizar el contador en el navbar
        window.dispatchEvent(new Event('refresh-notifications'))
      }
    } catch (error) {
      console.error('Error archivando:', error)
    }
  }

  // Eliminar
  const handleDelete = async (notificationId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.notification_id !== notificationId))
        setTotal(total - 1)
        // Disparar evento para actualizar el contador en el navbar
        window.dispatchEvent(new Event('refresh-notifications'))
      }
    } catch (error) {
      console.error('Error eliminando:', error)
    }
  }

  // Manejar click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await handleMarkAsRead(notification.notification_id)
    }

    if (notification.metadata?.action_url) {
      router.push(notification.metadata.action_url)
    }
  }

  // Obtener icono según tipo
  const getNotificationIconByType = (notificationType: string) => {
    const Icon = getNotificationIcon(notificationType)
    const iconClass = "w-5 h-5"
    const textColor = getNotificationTextColor(notificationType).replace('text-', '')
    return <Icon className={`${iconClass} ${textColor}`} />
  }

  // Obtener color según tipo
  const getNotificationColor = (notificationType: string) => {
    return getNotificationBorderColor(notificationType)
  }

  // Obtener color de fondo según prioridad
  const getPriorityBg = (priority: string, isUnread: boolean) => {
    const baseColors = {
      critical: 'hover:bg-red-500/10',
      high: 'hover:bg-orange-500/10',
      medium: 'hover:bg-yellow-500/10',
      low: 'hover:bg-blue-500/10',
      default: 'hover:bg-gray-500/10'
    }
    
    const unreadBg = isUnread 
      ? 'bg-gray-50 dark:bg-gray-800' 
      : 'bg-white dark:bg-gray-900'
    return `${unreadBg} ${baseColors[priority as keyof typeof baseColors] || baseColors.default}`
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  return (
    <div className="min-h-screen bg-carbon py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-blue-500/20">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notificaciones
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {total} {total === 1 ? 'notificación' : 'notificaciones'} en total
                  {unreadCount > 0 && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                      • {unreadCount} {unreadCount === 1 ? 'sin leer' : 'sin leer'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Marcar todas como leídas</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'unread', 'read', 'archived'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter)
                  setOffset(0)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter === 'all' && 'Todas'}
                {filter === 'unread' && 'Sin leer'}
                {filter === 'read' && 'Leídas'}
                {filter === 'archived' && 'Archivadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-[3px] border-blue-600/30 dark:border-blue-400/30 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative mx-auto mb-4 w-16 h-16"
              >
                <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-full border border-gray-300 dark:border-gray-700">
                  <Bell className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto" />
                </div>
              </motion.div>
              <p className="text-gray-900 dark:text-gray-300 text-sm font-medium mb-1">No hay notificaciones</p>
              <p className="text-gray-600 dark:text-gray-500 text-xs">
                {statusFilter === 'all' 
                  ? 'Recibirás notificaciones cuando haya actividad'
                  : `No hay notificaciones ${statusFilter === 'unread' ? 'sin leer' : statusFilter === 'read' ? 'leídas' : 'archivadas'}`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.notification_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className={`relative px-6 py-5 border-l-4 ${getNotificationColor(notification.notification_type)} ${getPriorityBg(notification.priority, notification.status === 'unread')} transition-all duration-200 cursor-pointer group`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Indicador de no leída */}
                      {notification.status === 'unread' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full -ml-1.5"
                        />
                      )}
                      
                      <div className="flex items-start gap-4">
                        {/* Icono según tipo de notificación */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.notification_type)}`}>
                            {getNotificationIconByType(notification.notification_type)}
                          </div>
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-base font-semibold ${
                                  notification.status === 'unread' 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </p>
                                {notification.status === 'unread' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                                  />
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {formatDistanceToNow(new Date(notification.created_at), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                              {notification.status === 'unread' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.notification_id)
                                  }}
                                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 active:scale-95"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArchive(notification.notification_id)
                                }}
                                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 active:scale-95"
                                title="Archivar"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notification.notification_id)
                                }}
                                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Botón Ver Más */}
              {hasMore && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() => loadNotifications(false)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Cargando...</span>
                      </>
                    ) : (
                      <>
                        <span>Ver más notificaciones</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

