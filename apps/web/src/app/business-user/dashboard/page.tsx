'use client'

import { motion } from 'framer-motion'
import { BookOpen, Clock, Award, CheckCircle2, PlayCircle, TrendingUp } from 'lucide-react'

export default function BusinessUserDashboardPage() {
  const myStats = [
    { label: 'Cursos Asignados', value: '12', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'En Progreso', value: '5', icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Completados', value: '7', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: 'Certificados', value: '3', icon: Award, color: 'from-orange-500 to-red-500' },
  ]

  const assignedCourses = [
    { 
      id: 1, 
      title: 'IA Generativa para Negocios', 
      instructor: 'Dr. Carlos Ruiz',
      progress: 75,
      status: 'En progreso',
      thumbnail: '📊'
    },
    { 
      id: 2, 
      title: 'Python Avanzado', 
      instructor: 'Dra. María García',
      progress: 45,
      status: 'En progreso',
      thumbnail: '🐍'
    },
    { 
      id: 3, 
      title: 'Machine Learning Fundamentals', 
      instructor: 'Ing. Juan Pérez',
      progress: 100,
      status: 'Completado',
      thumbnail: '🤖'
    },
    { 
      id: 4, 
      title: 'Diseño UX/UI', 
      instructor: 'Diseñadora Ana López',
      progress: 0,
      status: 'Asignado',
      thumbnail: '🎨'
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-carbon via-carbon to-carbon-dark p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
          Mi Panel de Aprendizaje
        </h1>
        <p className="text-carbon-300 text-lg">Continúa tu crecimiento profesional</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {myStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group overflow-hidden bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600 hover:border-primary/50 transition-all duration-300"
            >
              <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity`}></div>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-carbon-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Assigned Courses */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Mis Cursos Asignados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-2xl border border-carbon-600 hover:border-primary/50 transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-carbon-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{course.thumbnail}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course.status === 'Completado' 
                      ? 'bg-green-500/20 text-green-400'
                      : course.status === 'En progreso'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-carbon-600 text-carbon-300'
                  }`}>
                    {course.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-carbon-400 text-sm mb-4">Por {course.instructor}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-carbon-300">Progreso</span>
                    <span className="text-primary font-semibold">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-carbon-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ delay: index * 0.2, duration: 1 }}
                      className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                    />
                  </div>
                </div>
                
                <button className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-success rounded-lg text-white font-semibold hover:from-primary/90 hover:to-success/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20">
                  {course.progress === 100 ? (
                    <>
                      <Award className="w-5 h-5" />
                      Ver Certificado
                    </>
                  ) : course.progress > 0 ? (
                    <>
                      <PlayCircle className="w-5 h-5" />
                      Continuar Curso
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Empezar Curso
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}

