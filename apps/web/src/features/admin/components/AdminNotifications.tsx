'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

interface AdminNotificationsProps {
  notifications?: Notification[]
}

export function AdminNotifications({ notifications = [] }: AdminNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Datos de ejemplo - en producción vendrían de la API
  const [notificationsList, setNotificationsList] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nuevo usuario registrado',
      message: 'María García se ha registrado en la plataforma',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutos atrás
      actionUrl: '/admin/users'
    },
    {
      id: '2',
      title: 'Comunidad creada',
      message: 'Se ha creado la comunidad "Desarrollo Web"',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutos atrás
      actionUrl: '/admin/communities'
    },
    {
      id: '3',
      title: 'Solicitud de acceso',
      message: 'Juan Pérez solicita acceso a la comunidad "IA Avanzada"',
      type: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      actionUrl: '/admin/communities'
    },
    {
      id: '4',
      title: 'Error en sistema',
      message: 'Se detectó un error en el procesamiento de imágenes',
      type: 'error',
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
      actionUrl: '/admin/logs'
    }
  ])

  useEffect(() => {
    const unread = notificationsList.filter(n => !n.isRead).length
    setUnreadCount(unread)
  }, [notificationsList])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'error':
        return 'bg-red-500/10 border-red-500/20'
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotificationsList(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotificationsList(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotificationsList(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
      >
        <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" />
        
        {/* Badge de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notificationsList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="py-2">
                {notificationsList.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                        } px-4 py-3 border-l-4 ${getNotificationBgColor(notification.type)} ${
                          !notification.isRead ? 'bg-gray-100/50 dark:bg-gray-700/30' : ''
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsList.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
