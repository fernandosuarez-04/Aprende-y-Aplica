'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  BarChart3,
  Clock,
  TrendingUp,
  GraduationCap,
  Settings
} from 'lucide-react'
import { Card, CardContent } from '@aprende-y-aplica/ui'

export function BusinessPanelDashboard() {
  const stats = [
    {
      name: 'Usuarios Activos',
      value: '145',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Cursos Asignados',
      value: '48',
      change: '+8',
      changeType: 'positive' as const,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Completados',
      value: '23',
      change: '+15%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'En Progreso',
      value: '62%',
      change: '+5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500'
    },
  ]

  const quickActions = [
    {
      title: 'Agregar Usuario',
      description: 'Invitar nuevo miembro al equipo',
      icon: Users,
      href: '/business-panel/users/add',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Asignar Curso',
      description: 'Crear nueva asignación de curso',
      icon: BookOpen,
      href: '/business-panel/courses/assign',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Ver Reportes',
      description: 'Revisar analíticas y métricas',
      icon: BarChart3,
      href: '/business-panel/reports',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Configuración',
      description: 'Gestionar preferencias del equipo',
      icon: Settings,
      href: '/business-panel/settings',
      color: 'from-orange-500 to-red-500'
    },
  ]

  const recentActivity = [
    { user: 'María García', action: 'completó el curso de IA Generativa', time: 'hace 2 horas', icon: CheckCircle },
    { user: 'Juan Pérez', action: 'se unió a tu organización', time: 'hace 5 horas', icon: Users },
    { user: 'Ana López', action: 'inició el curso de Python Avanzado', time: 'hace 1 día', icon: BookOpen },
    { user: 'Carlos Ruiz', action: 'completó el curso de Machine Learning', time: 'hace 2 días', icon: CheckCircle },
  ]

  return (
    <div className="w-full space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-success/10 to-primary/20 rounded-2xl border border-primary/30 p-8 shadow-xl"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-carbon-200 text-lg">
            Gestiona tu equipo y supervisa el progreso de aprendizaje
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <Card variant="glassmorphism" className="h-full border-carbon-600 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' 
                        ? 'text-green-400 bg-green-400/10' 
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-carbon-400 text-sm mb-2">{stat.name}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.a
                  key={action.title}
                  href={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative overflow-hidden bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-carbon-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{action.title}</h3>
                    <p className="text-carbon-400 text-sm">{action.description}</p>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-carbon-700/50 to-carbon-800/50 rounded-xl border border-carbon-600/50 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-carbon-400 text-xs mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Resumen de Progreso</h2>
        <Card variant="glassmorphism" className="border-carbon-600">
          <CardContent className="p-8">
            <div className="space-y-6">
              {[
                { label: 'IA Generativa para Negocios', progress: 85, students: 45 },
                { label: 'Python Avanzado', progress: 62, students: 32 },
                { label: 'Machine Learning Fundamentals', progress: 48, students: 28 },
                { label: 'Diseño UX/UI', progress: 73, students: 19 },
              ].map((course, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{course.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-carbon-400 text-sm">{course.students} estudiantes</span>
                      <span className="text-primary font-semibold">{course.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-carbon-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

