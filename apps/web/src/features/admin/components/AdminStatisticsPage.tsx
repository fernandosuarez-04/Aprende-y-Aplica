'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAdminStats } from '../hooks/useAdminStats'

interface StatCard {
  id: string
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ComponentType<any>
  color: string
}

interface ChartData {
  month: string
  users: number
  workshops: number
  communities: number
  prompts: number
}

export function AdminStatisticsPage() {
  console.log('🚀 AdminStatisticsPage: Componente iniciado')
  
  const { stats: dbStats, isLoading, error } = useAdminStats()
  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  // Debug: Log de datos
  useEffect(() => {
    console.log('📊 AdminStatisticsPage - dbStats:', dbStats)
    console.log('📊 AdminStatisticsPage - isLoading:', isLoading)
    console.log('📊 AdminStatisticsPage - error:', error)
  }, [dbStats, isLoading, error])

  // Convertir datos de la base de datos a formato de tarjetas
  const stats: StatCard[] = dbStats ? [
    {
      id: 'total-users',
      title: 'Usuarios Totales',
      value: dbStats.totalUsers.toLocaleString(),
      change: `${dbStats.userGrowth >= 0 ? '+' : ''}${dbStats.userGrowth}%`,
      changeType: dbStats.userGrowth >= 0 ? 'increase' : 'decrease',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      id: 'active-courses',
      title: 'Cursos Activos',
      value: dbStats.activeCourses.toLocaleString(),
      change: `${dbStats.courseGrowth >= 0 ? '+' : ''}${dbStats.courseGrowth}%`,
      changeType: dbStats.courseGrowth >= 0 ? 'increase' : 'decrease',
      icon: BookOpenIcon,
      color: 'green'
    },
    {
      id: 'communities',
      title: 'Comunidades',
      value: '0', // No tenemos datos de comunidades en AdminStats
      change: '+0%',
      changeType: 'increase',
      icon: UserGroupIcon,
      color: 'purple'
    },
    {
      id: 'ai-apps',
      title: 'Apps de IA',
      value: dbStats.totalAIApps.toLocaleString(),
      change: `${dbStats.aiAppGrowth >= 0 ? '+' : ''}${dbStats.aiAppGrowth}%`,
      changeType: dbStats.aiAppGrowth >= 0 ? 'increase' : 'decrease',
      icon: CpuChipIcon,
      color: 'orange'
    },
    {
      id: 'prompts',
      title: 'Prompts',
      value: '0', // No tenemos datos de prompts en AdminStats
      change: '+0%',
      changeType: 'increase',
      icon: ChatBubbleLeftRightIcon,
      color: 'red'
    },
    {
      id: 'news',
      title: 'Noticias',
      value: dbStats.totalNews.toLocaleString(),
      change: `${dbStats.newsGrowth >= 0 ? '+' : ''}${dbStats.newsGrowth}%`,
      changeType: dbStats.newsGrowth >= 0 ? 'increase' : 'decrease',
      icon: NewspaperIcon,
      color: 'indigo'
    }
  ] : []

  // Datos de ejemplo para el gráfico (por ahora)
  const chartData: ChartData[] = [
    { month: 'Ene', users: 1200, workshops: 45, communities: 12, prompts: 234 },
    { month: 'Feb', users: 1350, workshops: 52, communities: 15, prompts: 267 },
    { month: 'Mar', users: 1480, workshops: 58, communities: 18, prompts: 298 },
    { month: 'Abr', users: 1620, workshops: 65, communities: 22, prompts: 334 },
    { month: 'May', users: 1780, workshops: 72, communities: 26, prompts: 367 },
    { month: 'Jun', users: 1950, workshops: 78, communities: 30, prompts: 398 },
    { month: 'Jul', users: 2130, workshops: 85, communities: 34, prompts: 434 },
    { month: 'Ago', users: 2300, workshops: 89, communities: 34, prompts: 456 }
  ]

  const getColorClasses = (color: string, changeType: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Estadísticas de la Plataforma
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualiza las métricas y tendencias de la plataforma
              </p>
              {dbStats && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    dbStats.totalUsers > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {dbStats.totalUsers > 0 ? '📊 Datos en tiempo real' : '⚠️ Datos de ejemplo'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="1month">Último mes</option>
                <option value="3months">Últimos 3 meses</option>
                <option value="6months">Últimos 6 meses</option>
                <option value="1year">Último año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const colors = getColorClasses(stat.color, stat.changeType)
            return (
              <div 
                key={stat.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${colors.bg}`}>
                    <stat.icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <div className="flex items-center ml-2">
                        {stat.changeType === 'increase' ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                        )}
                        <p className={`text-sm font-medium ${colors.change}`}>
                          {stat.change}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crecimiento Mensual
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Últimos 8 meses
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => {
                const maxValue = Math.max(...chartData.map(d => d.users))
                const height = (data.users / maxValue) * 100
                
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: `${height}%` }}>
                      <div className="absolute inset-0 bg-blue-500 rounded-t-lg opacity-80"></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {data.month}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {data.users}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribución de Contenido
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Por categoría
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Talleres</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Comunidades</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Prompts</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Apps de IA</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              Últimas 24 horas
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">15 nuevos usuarios registrados</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Hace 2 horas</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">3 nuevos talleres creados</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Hace 4 horas</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">1 nueva comunidad creada</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Hace 6 horas</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">8 nuevos prompts agregados</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Hace 8 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
