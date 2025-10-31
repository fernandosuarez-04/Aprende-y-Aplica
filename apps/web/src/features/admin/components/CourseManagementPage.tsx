'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, GripVertical, Book, FileText, ClipboardList, Flag, Clock, BarChart3, LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks } from 'lucide-react'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from './AdvancedCharts'
import { useAdminModules } from '../hooks/useAdminModules'
import { useAdminLessons } from '../hooks/useAdminLessons'
import { useAdminMaterials } from '../hooks/useAdminMaterials'
import { useAdminActivities } from '../hooks/useAdminActivities'
import { AdminModule } from '../services/adminModules.service'
import { AdminLesson } from '../services/adminLessons.service'

const ModuleModal = dynamic(() => import('./ModuleModal').then(mod => ({ default: mod.ModuleModal })), {
  ssr: false
})
const LessonModal = dynamic(() => import('./LessonModal').then(mod => ({ default: mod.LessonModal })), {
  ssr: false
})
const MaterialModal = dynamic(() => import('./MaterialModal').then(mod => ({ default: mod.MaterialModal })), {
  ssr: false
})
const ActivityModal = dynamic(() => import('./ActivityModal').then(mod => ({ default: mod.ActivityModal })), {
  ssr: false
})

interface CourseManagementPageProps {
  courseId: string
}

export function CourseManagementPage({ courseId }: CourseManagementPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'modules' | 'config' | 'preview' | 'stats'>('modules')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [instructors, setInstructors] = useState<Array<{ id: string, name: string }>>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any>(null)

  const { modules, loading: modulesLoading, fetchModules, createModule, updateModule, deleteModule } = useAdminModules()
  const { lessons, loading: lessonsLoading, fetchLessons, createLesson, updateLesson, deleteLesson } = useAdminLessons()
  const { materials, fetchMaterials, createMaterial } = useAdminMaterials()
  const { activities, fetchActivities, createActivity } = useAdminActivities()

  useEffect(() => {
    fetchModules(courseId)
    // Obtener instructores
    fetch('/api/admin/instructors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInstructors(data.instructors || [])
        }
      })
      .catch(err => console.error('Error fetching instructors:', err))
  }, [courseId])

  useEffect(() => {
    if (activeTab === 'stats') {
      ;(async () => {
        try {
          setStatsLoading(true)
          const res = await fetch(`/api/instructor/workshops/${courseId}/stats`)
          const data = await res.json()
          if (res.ok && data?.stats) {
            setUserStats(data.stats)
            setEnrolledUsers(data.enrolled_users || [])
            setChartData(data.charts || null)
          }
        } catch (e) {
          console.error('Error cargando estadísticas:', e)
        } finally {
          setStatsLoading(false)
        }
      })()
    }
  }, [activeTab, courseId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
        fetchLessons(moduleId)
      }
      return newSet
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
        fetchMaterials(lessonId)
        fetchActivities(lessonId)
      }
      return newSet
    })
  }

  const handleCreateModule = async (data: any) => {
    await createModule(courseId, data)
  }

  const handleEditModule = async (moduleId: string, data: any) => {
    await updateModule(moduleId, data)
  }

  const handleCreateLesson = async (data: any) => {
    if (editingModuleId) {
      await createLesson(editingModuleId, data)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('¿Estás seguro de eliminar este módulo?')) {
      await deleteModule(moduleId)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('¿Estás seguro de eliminar esta lección?')) {
      await deleteLesson(lessonId)
    }
  }

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(l => l.module_id === moduleId)
  }

  const getLessonMaterials = (lessonId: string) => {
    return materials.filter(m => m.lesson_id === lessonId)
  }

  const getLessonActivities = (lessonId: string) => {
    return activities.filter(a => a.lesson_id === lessonId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Mejorado */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Talleres
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Gestión de Curso
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Administra módulos, lecciones, materiales y actividades
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Mejorados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex space-x-1 p-1">
            {[
              { key: 'modules', label: '📚 Módulos', icon: 'modules' },
              { key: 'config', label: '⚙️ Configuración', icon: 'config' },
              { key: 'preview', label: '👁️ Vista Previa', icon: 'preview' },
              { key: 'stats', label: '📈 Estadísticas', icon: 'stats' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            {/* Botón Crear Módulo Mejorado */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedModule(null)
                  setShowModuleModal(true)
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Agregar Módulo</span>
              </button>
            </div>

            {/* Lista de Módulos */}
            {modulesLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Cargando módulos...</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">No hay módulos aún</p>
                <button
                  onClick={() => {
                    setSelectedModule(null)
                    setShowModuleModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear tu primer módulo</span>
                </button>
              </div>
            ) : (
              modules.map((module) => (
                <div key={module.module_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Header del Módulo Mejorado */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => toggleModule(module.module_id)}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {expandedModules.has(module.module_id) ? (
                          <ChevronDown className="w-6 h-6" />
                        ) : (
                          <ChevronRight className="w-6 h-6" />
                        )}
                      </button>
                      <div>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">{module.module_title}</span>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            module.is_published 
                              ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                              : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {module.is_published ? '✓ Publicado' : '● Borrador'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {module.module_duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingModuleId(module.module_id)
                          setSelectedLesson(null)
                          setShowLessonModal(true)
                        }}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                        title="Agregar lección"
                      >
                        <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedModule(module)
                          setShowModuleModal(true)
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.module_id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium text-red-600 dark:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Lecciones del Módulo */}
                  {expandedModules.has(module.module_id) && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
                      {getModuleLessons(module.module_id).length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-blue-500" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">No hay lecciones en este módulo</p>
                          <button
                            onClick={() => {
                              setEditingModuleId(module.module_id)
                              setSelectedLesson(null)
                              setShowLessonModal(true)
                            }}
                            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Agrega tu primera lección</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getModuleLessons(module.module_id).map((lesson) => (
                            <div key={lesson.lesson_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                              {/* Header de la Lección Mejorado */}
                              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50">
                                <div className="flex items-center space-x-4 flex-1">
                                  <button
                                    onClick={() => toggleLesson(lesson.lesson_id)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    {expandedLessons.has(lesson.lesson_id) ? (
                                      <ChevronDown className="w-5 h-5" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <span className="font-semibold text-gray-900 dark:text-white block">{lesson.lesson_title}</span>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {Math.floor(lesson.duration_seconds / 60)} min
                                      </span>
                                      {lesson.instructor_name && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">por {lesson.instructor_name}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowMaterialModal(true)
                                    }}
                                    className="p-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all group"
                                    title="Agregar material"
                                  >
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowActivityModal(true)
                                    }}
                                    className="p-2.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all group"
                                    title="Agregar actividad"
                                  >
                                    <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(lesson.lesson_id)}
                                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium text-red-600 dark:text-red-400"
                                    title="Eliminar lección"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>

                              {/* Materiales y Actividades de la Lección */}
                              {expandedLessons.has(lesson.lesson_id) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Materiales */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                          Materiales
                                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                            {getLessonMaterials(lesson.lesson_id).length}
                                          </span>
                                        </h4>
                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowMaterialModal(true)
                                          }}
                                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        >
                                          + Agregar
                                        </button>
                                      </div>
                                      {getLessonMaterials(lesson.lesson_id).length === 0 ? (
                                        <p className="text-xs text-gray-400 italic text-center py-4">No hay materiales</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {getLessonMaterials(lesson.lesson_id).map(material => (
                                            <div key={material.material_id} className="text-xs p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                              <div className="font-medium text-gray-900 dark:text-white">{material.material_title}</div>
                                              <div className="text-gray-500 dark:text-gray-400 mt-1">
                                                {material.material_type}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Actividades */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                          <ClipboardList className="w-4 h-4 mr-2 text-purple-500" />
                                          Actividades
                                          <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                                            {getLessonActivities(lesson.lesson_id).length}
                                          </span>
                                        </h4>
                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setShowActivityModal(true)
                                          }}
                                          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                        >
                                          + Agregar
                                        </button>
                                      </div>
                                      {getLessonActivities(lesson.lesson_id).length === 0 ? (
                                        <p className="text-xs text-gray-400 italic text-center py-4">No hay actividades</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {getLessonActivities(lesson.lesson_id).map(activity => (
                                            <div key={activity.activity_id} className="text-xs p-3 bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                              <div className="font-medium text-gray-900 dark:text-white">{activity.activity_title}</div>
                                              <div className="text-gray-500 dark:text-gray-400 mt-1">
                                                {activity.activity_type}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">Cargando estadísticas...</div>
            ) : (
              <>
                {/* Estadísticas del Curso */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    Estadísticas del Curso
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Módulos</div>
                      <div className="text-3xl font-bold">{modules.length}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{modules.filter((m: any) => m.is_published).length} publicados</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Lecciones</div>
                      <div className="text-3xl font-bold">{userStats?.total_lessons ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Duración total</div>
                      <div className="text-3xl font-bold">{modules.reduce((acc: number, m: any) => acc + (m.module_duration_minutes || 0), 0)} min</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Materiales</div>
                      <div className="text-3xl font-bold">{userStats?.total_materials ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Actividades</div>
                      <div className="text-3xl font-bold">{userStats?.total_activities ?? '—'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{userStats?.completed_activities ?? 0} completadas</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notas creadas</div>
                      <div className="text-3xl font-bold">{userStats?.total_notes ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Usuarios */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    Estadísticas de Usuarios
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Usuarios inscritos</div>
                      <div className="text-3xl font-bold">{userStats?.total_enrolled ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">En progreso</div>
                      <div className="text-3xl font-bold">{userStats?.in_progress ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Completados</div>
                      <div className="text-3xl font-bold">{userStats?.completed ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No iniciados</div>
                      <div className="text-3xl font-bold">{userStats?.not_started ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Progreso promedio</div>
                      <div className="text-3xl font-bold">{userStats ? `${Math.round(userStats.average_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Activos últimos 7 días</div>
                      <div className="text-3xl font-bold">{userStats?.active_7d ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Activos últimos 30 días</div>
                      <div className="text-3xl font-bold">{userStats?.active_30d ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Certificados emitidos</div>
                      <div className="text-3xl font-bold">{userStats?.total_certificates ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas Financieras */}
                {(userStats?.total_purchases > 0 || userStats?.total_revenue_cents > 0) && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      Estadísticas Financieras
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Compras totales</div>
                        <div className="text-3xl font-bold">{userStats?.total_purchases ?? '—'}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{userStats?.active_purchases ?? 0} activas</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ingresos totales</div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats?.total_revenue_display ?? '$0.00'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estadísticas de Reseñas */}
                {userStats?.total_reviews > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      Reseñas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total de reseñas</div>
                        <div className="text-3xl font-bold">{userStats?.total_reviews ?? '—'}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Calificación promedio</div>
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{userStats?.average_rating ? `${userStats.average_rating.toFixed(1)} ⭐` : '—'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Análisis Estadístico Profundo */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                    <Sigma className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    Análisis Estadístico Profundo
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mediana de Progreso</div>
                      <div className="text-2xl font-bold">{userStats?.median_progress ? `${Math.round(userStats.median_progress)}%` : '—'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Valor central</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Desviación Estándar</div>
                      <div className="text-2xl font-bold">{userStats?.std_deviation ?? '—'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Dispersión de datos</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Rango Intercuartílico</div>
                      <div className="text-2xl font-bold">{userStats?.iqr_progress ? `${Math.round(userStats.iqr_progress)}%` : '—'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Q3 - Q1</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Rango Total</div>
                      <div className="text-2xl font-bold">
                        {userStats?.min_progress !== undefined && userStats?.max_progress !== undefined
                          ? `${Math.round(userStats.min_progress)}% - ${Math.round(userStats.max_progress)}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Primer Cuartil (Q1)</div>
                      <div className="text-2xl font-bold">{userStats?.q1_progress ? `${Math.round(userStats.q1_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tercer Cuartil (Q3)</div>
                      <div className="text-2xl font-bold">{userStats?.q3_progress ? `${Math.round(userStats.q3_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Varianza</div>
                      <div className="text-2xl font-bold">{userStats?.variance ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tiempo Promedio de Finalización</div>
                      <div className="text-2xl font-bold">{userStats?.avg_completion_days ? `${Math.round(userStats.avg_completion_days)} días` : '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Métricas de RRHH */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    Métricas de RRHH
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tasa de Retención</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Usuarios activos últimos 30 días</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tasa de Finalización</div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Completados / Inscritos</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tasa de Abandono</div>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {userStats?.retention_rate !== undefined 
                          ? `${(100 - userStats.retention_rate).toFixed(1)}%`
                          : '—'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Usuarios inactivos</div>
                    </div>
                  </div>
                </div>

                {/* Gráficas Avanzadas */}
                {chartData && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      Visualizaciones Avanzadas
                    </h2>
                    
                    {chartData.enrollment_trend && chartData.enrollment_trend.length > 0 && (
                      <EnrollmentTrendChart data={chartData.enrollment_trend} darkMode={false} />
                    )}

                    {chartData.progress_distribution && chartData.progress_distribution.length > 0 && (
                      <ProgressDistributionChart data={chartData.progress_distribution} darkMode={false} />
                    )}

                    {chartData.engagement_data && chartData.engagement_data.length > 0 && (
                      <EngagementScatterChart data={chartData.engagement_data} darkMode={false} />
                    )}

                    {chartData.enrollment_rates && chartData.enrollment_rates.length > 0 && (
                      <CompletionRateChart data={chartData.enrollment_rates} darkMode={false} />
                    )}

                    {/* Gráficas de pastel: Roles y Áreas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {chartData.user_roles_pie && chartData.user_roles_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_roles_pie} title="Distribución por Rol" darkMode={false} />
                      )}
                      {chartData.user_areas_pie && chartData.user_areas_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_areas_pie} title="Distribución por Área" darkMode={false} />
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Usuarios Inscritos */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    Lista de Usuarios Inscritos
                  </h2>
                  {enrolledUsers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
                      No hay usuarios inscritos aún
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Progreso</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Inscrito</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Última actividad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {enrolledUsers.map((user: any) => (
                              <tr key={user.enrollment_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    {user.profile_picture ? (
                                      <img src={user.profile_picture} alt={user.display_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                        {user.display_name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-gray-900 dark:text-white font-medium">{user.display_name}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email || user.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    user.enrollment_status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' :
                                    user.enrollment_status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                  }`}>
                                    {user.enrollment_status === 'completed' ? 'Completado' :
                                     user.enrollment_status === 'active' ? 'Activo' :
                                     user.enrollment_status === 'paused' ? 'Pausado' :
                                     user.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all"
                                        style={{ width: `${user.progress_percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium w-12 text-right">
                                      {Math.round(user.progress_percentage)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                  {user.enrolled_at ? new Date(user.enrolled_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                  {user.last_accessed_at ? new Date(user.last_accessed_at).toLocaleString() : 'Nunca'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Modales */}
        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data) => {
              if (selectedModule) {
                await handleEditModule(selectedModule.module_id, data)
              } else {
                await handleCreateModule(data)
              }
              setShowModuleModal(false)
            }}
          />
        )}

        {showLessonModal && editingModuleId && (
          <LessonModal
            moduleId={editingModuleId}
            lesson={selectedLesson}
            onClose={() => {
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            onSave={async (data) => {
              await handleCreateLesson(data)
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            instructors={instructors}
          />
        )}

        {showMaterialModal && editingLessonId && (
          <MaterialModal
            material={null}
            lessonId={editingLessonId}
            onClose={() => {
              setShowMaterialModal(false)
              setEditingLessonId(null)
            }}
            onSave={async (data) => {
              await createMaterial(editingLessonId, data)
              setShowMaterialModal(false)
              setEditingLessonId(null)
            }}
          />
        )}

        {showActivityModal && editingLessonId && (
          <ActivityModal
            activity={null}
            lessonId={editingLessonId}
            onClose={() => {
              setShowActivityModal(false)
              setEditingLessonId(null)
            }}
            onSave={async (data) => {
              await createActivity(editingLessonId, data)
              setShowActivityModal(false)
              setEditingLessonId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

