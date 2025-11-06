'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Archive, Trash2, AlertCircle, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getNotificationIcon, getNotificationBorderColor, getNotificationBgColor, getNotificationTextColor } from '@/features/notifications/utils/notification-categories'

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

  // Obtener icono según tipo de notificación
  const getNotificationIconByType = (notificationType: string) => {
    const Icon = getNotificationIcon(notificationType)
    const iconClass = "w-5 h-5"
    const textColor = getNotificationTextColor(notificationType).replace('text-', '')
    return <Icon className={`${iconClass} ${textColor}`} />
  }

  // Obtener color según tipo de notificación
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

  // Manejar click en notificación
  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no está leída
    if (notification.status === 'unread') {
      try {
        await markAsRead(notification.notification_id)
      } catch (error) {
        console.error('Error marcando notificación como leída:', error)
      }
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
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
    }
  }

  // Manejar archivar
  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await archiveNotification(notificationId)
    } catch (error) {
      console.error('Error archivando notificación:', error)
    }
  }

  // Manejar eliminar
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    // Confirmar antes de eliminar
    if (window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      try {
        await deleteNotification(notificationId)
      } catch (error) {
        console.error('Error eliminando notificación:', error)
      }
    }
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
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-xs flex items-center justify-center text-white font-bold z-10 shadow-lg shadow-red-500/50 border border-red-400/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
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
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2 
            }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[100] max-h-[28rem] overflow-hidden"
          >
            {/* Header con gradiente */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="relative bg-gray-100 dark:bg-gray-700 p-2 rounded-lg border border-blue-500/20">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Notificaciones
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-500/30"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {unreadCount === 1 ? '1 sin leer' : `${unreadCount} sin leer`}
                    </p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 border border-blue-500/20"
                  disabled={isLoading}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Marcar todas</span>
                </button>
              )}
            </div>

            {/* Lista de Notificaciones */}
            <div className="max-h-[20rem] overflow-y-auto scrollbar-thin-dark bg-white dark:bg-gray-900">
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
                  <p className="text-gray-600 dark:text-gray-500 text-xs">Recibirás notificaciones cuando haya actividad</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.notification_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`relative px-5 py-4 border-l-4 ${getNotificationColor(notification.notification_type)} ${getPriorityBg(notification.priority, notification.status === 'unread')} transition-all duration-200 cursor-pointer group`}
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
                      
                      <div className="flex items-start gap-3">
                        {/* Icono según tipo de notificación con fondo */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.notification_type)}`}>
                            {getNotificationIconByType(notification.notification_type)}
                          </div>
                        </div>
                        
                        {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-sm font-semibold ${
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
                                  
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 mt-2">
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
                                      onClick={(e) => handleMarkAsRead(e, notification.notification_id)}
                                      className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 active:scale-95"
                                      title="Marcar como leída"
                                      aria-label="Marcar como leída"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleArchive(e, notification.notification_id)}
                                    className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 active:scale-95"
                                    title="Archivar"
                                    aria-label="Archivar notificación"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, notification.notification_id)}
                                    className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                                    title="Eliminar"
                                    aria-label="Eliminar notificación"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 flex items-center justify-center gap-2 font-medium group"
                >
                  <span>Ver todas las notificaciones</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                  </motion.div>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

