'use client'

import { useState, useEffect } from 'react'
import { 
  UserCircleIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  type: 'user' | 'workshop' | 'community' | 'prompt' | 'ai-app' | 'news'
  action: string
  description: string
  user: string
  timestamp: string
  icon: React.ComponentType<any>
  color: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'user',
    action: 'Usuario registrado',
    description: 'Nuevo usuario se registró en la plataforma',
    user: 'Juan Pérez',
    timestamp: 'Hace 5 minutos',
    icon: UserCircleIcon,
    color: 'blue'
  },
  {
    id: '2',
    type: 'workshop',
    action: 'Taller creado',
    description: 'Se creó el taller "Introducción a React"',
    user: 'María García',
    timestamp: 'Hace 15 minutos',
    icon: BookOpenIcon,
    color: 'green'
  },
  {
    id: '3',
    type: 'community',
    action: 'Comunidad actualizada',
    description: 'Se actualizó la comunidad "Desarrolladores Frontend"',
    user: 'Carlos López',
    timestamp: 'Hace 30 minutos',
    icon: UserGroupIcon,
    color: 'purple'
  },
  {
    id: '4',
    type: 'prompt',
    action: 'Prompt agregado',
    description: 'Se añadió un nuevo prompt de ChatGPT',
    user: 'Ana Martínez',
    timestamp: 'Hace 1 hora',
    icon: ChatBubbleLeftRightIcon,
    color: 'orange'
  },
  {
    id: '5',
    type: 'ai-app',
    action: 'App de IA añadida',
    description: 'Se agregó "Midjourney" al directorio',
    user: 'Pedro Rodríguez',
    timestamp: 'Hace 2 horas',
    icon: CpuChipIcon,
    color: 'red'
  },
  {
    id: '6',
    type: 'news',
    action: 'Noticia publicada',
    description: 'Se publicó "Tendencias en IA 2024"',
    user: 'Laura Sánchez',
    timestamp: 'Hace 3 horas',
    icon: NewspaperIcon,
    color: 'indigo'
  }
]

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setActivities(mockActivities)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Actividad Reciente
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Ver todo
          </button>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const colors = getColorClasses(activity.color)
            return (
              <div 
                key={activity.id}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex-shrink-0 p-2 rounded-full ${colors.bg} border ${colors.border}`}>
                  <activity.icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {activity.timestamp}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    por {activity.user}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
