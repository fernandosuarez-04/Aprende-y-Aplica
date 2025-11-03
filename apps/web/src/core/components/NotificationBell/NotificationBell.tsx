'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Archive, Trash2 } from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Props del componente NotificationBell
 */
export interface NotificationBellProps {
  /**
   * Clase CSS adicional para el botón
   */
  className?: string
  
  /**
   * Tamaño del icono (default: 'md')
   */
  iconSize?: 'sm' | 'md' | 'lg'
  
  /**
   * Mostrar animación de pulso cuando hay notificaciones críticas
   */
  showPulse?: boolean
  
  /**
   * Variante del diseño ('default' | 'compact')
   */
  variant?: 'default' | 'compact'
}

/**
 * Componente NotificationBell
 * 
 * Muestra un botón de campana con badge de contador de no leídas
 * y un dropdown con las últimas notificaciones
 * 
 * Usa el contexto global de notificaciones
 */
export function NotificationBell({
  className = '',
  iconSize = 'md',
  showPulse = true,
  variant = 'default'
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    isDropdownOpen,
    setIsDropdownOpen
  } = useNotifications()

  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, setIsDropdownOpen])

  // Tamaños de icono
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // Obtener icono según prioridad
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🟠'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '🔵'
    }
  }

  // Obtener color según prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10'
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10'
      default:
        return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  // Manejar click en notificación
  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no está leída
    if (notification.status === 'unread') {
      await markAsRead(notification.notification_id)
    }

    // Navegar a la URL de acción si existe
    if (notification.metadata?.action_url) {
      router.push(notification.metadata.action_url)
      setIsDropdownOpen(false)
    }
  }

  // Manejar marcar como leída
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await markAsRead(notificationId)
  }

  // Manejar archivar
  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await archiveNotification(notificationId)
  }

  // Manejar eliminar
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  // Manejar marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de Campana */}
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-3 text-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notificaciones"
      >
        <Bell className={`${iconSizes[iconSize]} text-text-secondary dark:text-text-secondary`} />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}

        {/* Animación de pulso para notificaciones críticas */}
        {showPulse && criticalCount > 0 && (
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.button>

      {/* Dropdown de Notificaciones */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-carbon-900 dark:bg-carbon-900 rounded-lg shadow-xl border border-carbon-700 dark:border-carbon-700 py-2 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-carbon-700 dark:border-carbon-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-carbon-400">
                    ({unreadCount} {unreadCount === 1 ? 'sin leer' : 'sin leer'})
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1"
                  disabled={isLoading}
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
            </div>

            {/* Lista de Notificaciones */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-carbon-400 text-sm">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-12 h-12 text-carbon-600 dark:text-carbon-600 mx-auto mb-3 opacity-50" />
                  <p className="text-carbon-400 text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.notification_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                        notification.status === 'unread' ? 'bg-carbon-800/50 dark:bg-carbon-800/50' : ''
                      } hover:bg-carbon-800/70 dark:hover:bg-carbon-800/70 transition-colors duration-200 cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icono de prioridad */}
                        <div className="flex-shrink-0 mt-0.5 text-lg">
                          {getPriorityIcon(notification.priority)}
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              notification.status === 'unread' ? 'text-white' : 'text-carbon-300'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2 ml-2">
                              {notification.status === 'unread' && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, notification.notification_id)}
                                  className="text-carbon-400 hover:text-green-400 transition-colors duration-200 p-1"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleArchive(e, notification.notification_id)}
                                className="text-carbon-400 hover:text-blue-400 transition-colors duration-200 p-1"
                                title="Archivar"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, notification.notification_id)}
                                className="text-carbon-400 hover:text-red-400 transition-colors duration-200 p-1"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-carbon-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <p className="text-xs text-carbon-500 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-carbon-700 dark:border-carbon-700">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors duration-200 block"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

