'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Clock, FileText, ClipboardList, Book, Settings, Eye, Edit3, BarChart3, TrendingUp, Users, LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks } from 'lucide-react'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from '@/features/admin/components/AdvancedCharts'
import { useAdminModules } from '@/features/admin/hooks/useAdminModules'
import { useAdminLessons } from '@/features/admin/hooks/useAdminLessons'
import { useAdminMaterials } from '@/features/admin/hooks/useAdminMaterials'
import { useAdminActivities } from '@/features/admin/hooks/useAdminActivities'
import { AdminModule } from '@/features/admin/services/adminModules.service'
import { AdminLesson } from '@/features/admin/services/adminLessons.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ModuleModal } from '@/features/admin/components/ModuleModal'
import { LessonModal } from '@/features/admin/components/LessonModal'
import { MaterialModal } from '@/features/admin/components/MaterialModal'
import { ActivityModal } from '@/features/admin/components/ActivityModal'

interface InstructorCourseManagementPageProps {
  courseId: string
}

export function InstructorCourseManagementPage({ courseId }: InstructorCourseManagementPageProps) {
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
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)

  const { modules, loading: modulesLoading, fetchModules, createModule, updateModule } = useAdminModules()
  const { lessons, loading: lessonsLoading, fetchLessons, createLesson, updateLesson } = useAdminLessons()
  const { materials, fetchMaterials, createMaterial } = useAdminMaterials()
  const { activities, fetchActivities, createActivity, updateActivity } = useAdminActivities()
  const { user } = useAuth()

  const [workshopPreview, setWorkshopPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any>(null)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [configData, setConfigData] = useState({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 60,
    price: 0,
    thumbnail_url: '',
    slug: '',
  })

  useEffect(() => {
    fetchModules(courseId)
    // cargar datos para vista previa
    const loadPreview = async () => {
      try {
        setPreviewLoading(true)
        const res = await fetch(`/api/instructor/workshops/${courseId}`)
        const data = await res.json()
        if (res.ok && data?.workshop) setWorkshopPreview(data.workshop)
      } finally {
        setPreviewLoading(false)
      }
    }
    loadPreview()
  }, [courseId])

  useEffect(() => {
    if (workshopPreview) {
      setConfigData({
        title: workshopPreview.title || '',
        description: workshopPreview.description || '',
        category: workshopPreview.category || 'ia',
        level: workshopPreview.level || 'beginner',
        duration_total_minutes: workshopPreview.duration_total_minutes || 60,
        price: workshopPreview.price || 0,
        thumbnail_url: workshopPreview.thumbnail_url || '',
        slug: workshopPreview.slug || '',
      })
    }
  }, [workshopPreview])

  // Cargar estadísticas de usuarios cuando se abre la pestaña
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

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setConfigData(prev => ({ ...prev, [name]: name === 'price' || name === 'duration_total_minutes' ? Number(value) : value }))
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingConfig(true)
      const res = await fetch(`/api/instructor/workshops/${courseId}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al guardar la configuración')
      }
      // refrescar preview
      const refreshed = await fetch(`/api/instructor/workshops/${courseId}`).then(r => r.json())
      if (refreshed?.workshop) setWorkshopPreview(refreshed.workshop)
      alert('Configuración guardada')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingConfig(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else {
        next.add(moduleId)
        fetchLessons(moduleId)
      }
      return next
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else {
        next.add(lessonId)
        fetchMaterials(lessonId)
        fetchActivities(lessonId)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-purple-200 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Talleres
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gestión de Curso</h1>
              <p className="text-purple-200/80">Administra módulos, lecciones, materiales y actividades</p>
            </div>
          </div>
        </div>

        {/* Tabs mínimos para instructor */}
        <div className="bg-gray-800/60 rounded-xl border border-purple-800/30 mb-6">
          <div className="flex p-1">
            {[
              { key: 'modules', label: 'Módulos', icon: Book },
              { key: 'config', label: 'Configuración', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'stats', label: 'Estadísticas', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-purple-900/20'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de módulos */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedModule(null)
                  setShowModuleModal(true)
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Agregar Módulo</span>
              </button>
            </div>

            {modulesLoading ? (
              <div className="text-center py-20 text-purple-200">Cargando módulos...</div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
                No hay módulos aún
              </div>
            ) : (
              modules.map(module => (
                <div key={module.module_id} className="rounded-xl border border-purple-800/30 bg-gray-900/60 overflow-hidden">
                  <div className="p-6 flex items-center justify-between border-b border-purple-800/30">
                    <div className="flex items-center space-x-4 flex-1">
                      <button onClick={() => toggleModule(module.module_id)} className="text-purple-300 hover:text-white">
                        {expandedModules.has(module.module_id) ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                      </button>
                      <div>
                        <span className="font-bold text-white text-xl">{module.module_title}</span>
                        <div className="flex items-center space-x-3 mt-1 text-purple-200">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/30 text-green-300 border border-green-700/40">
                            {module.is_published ? '✓ Publicado' : '● Borrador'}
                          </span>
                          <span className="text-sm flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {module.module_duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedModule(module)
                          setShowModuleModal(true)
                        }}
                        className="px-4 py-2 bg-purple-900/30 hover:bg-purple-800/40 rounded-lg text-sm text-purple-200"
                      >
                        Editar
                      </button>
                      {/* No mostramos eliminar en vista de instructor */}
                      <button
                        onClick={() => {
                          setEditingModuleId(module.module_id)
                          setSelectedLesson(null)
                          setShowLessonModal(true)
                        }}
                        className="p-3 bg-indigo-900/30 hover:bg-indigo-800/40 rounded-lg"
                        title="Agregar lección"
                      >
                        <Plus className="w-5 h-5 text-indigo-300" />
                      </button>
                    </div>
                  </div>

                  {expandedModules.has(module.module_id) && (
                    <div className="p-6">
                      {(lessons.filter(l => l.module_id === module.module_id).length === 0) ? (
                        <div className="text-center py-10 text-purple-200/80 border border-dashed border-purple-800/30 rounded-xl">
                          No hay lecciones aún
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lessons.filter(l => l.module_id === module.module_id).map(lesson => (
                            <div key={lesson.lesson_id} className="rounded-xl border border-purple-800/30 bg-gray-900/40">
                              <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <button onClick={() => toggleLesson(lesson.lesson_id)} className="text-purple-300 hover:text-white">
                                    {expandedLessons.has(lesson.lesson_id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                  </button>
                                  <div>
                                    <div className="text-white font-semibold">{lesson.lesson_title}</div>
                                    <div className="text-xs text-purple-200 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" />{Math.floor(lesson.duration_seconds / 60)} min</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowMaterialModal(true)
                                    }}
                                    className="p-2.5 bg-indigo-900/30 hover:bg-indigo-800/40 rounded-lg"
                                    title="Agregar material"
                                  >
                                    <FileText className="w-5 h-5 text-indigo-300" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowActivityModal(true)
                                    }}
                                    className="p-2.5 bg-purple-900/30 hover:bg-purple-800/40 rounded-lg"
                                    title="Agregar actividad"
                                  >
                                    <ClipboardList className="w-5 h-5 text-purple-300" />
                                  </button>
                                </div>
                              </div>

                              {expandedLessons.has(lesson.lesson_id) && (
                                <div className="p-4 border-t border-purple-800/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                    <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                      <span>Materiales</span>
                                      <button
                                        onClick={() => {
                                          setEditingLessonId(lesson.lesson_id)
                                          setShowMaterialModal(true)
                                        }}
                                        className="text-xs text-indigo-300 hover:text-indigo-200"
                                      >
                                        + Agregar
                                      </button>
                                    </div>
                                    {(materials.filter(m => m.lesson_id === lesson.lesson_id).length === 0) ? (
                                      <p className="text-xs text-purple-300/70">No hay materiales</p>
                                    ) : (
                                      <div className="space-y-2 text-xs text-purple-200">
                                        {materials.filter(m => m.lesson_id === lesson.lesson_id).map(m => (
                                          <div key={m.material_id} className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                                            <div className="font-medium text-white">{m.material_title}</div>
                                            <div className="text-purple-300/80 mt-1">{m.material_type}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                    <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                      <span>Actividades</span>
                                      <button
                                        onClick={() => {
                                          setEditingLessonId(lesson.lesson_id)
                                          setShowActivityModal(true)
                                        }}
                                        className="text-xs text-purple-300 hover:text-purple-200"
                                      >
                                        + Agregar
                                      </button>
                                    </div>
                                    {(activities.filter(a => a.lesson_id === lesson.lesson_id).length === 0) ? (
                                      <p className="text-xs text-purple-300/70">No hay actividades</p>
                                    ) : (
                                      <div className="space-y-2 text-xs">
                                        {activities.filter(a => a.lesson_id === lesson.lesson_id).map(a => (
                                          <div key={a.activity_id} className="p-3 rounded-lg bg-gray-900/60 border border-purple-700/40 flex items-center justify-between">
                                            <div>
                                              <div className="font-semibold text-white">{a.activity_title}</div>
                                              <div className="text-purple-200 mt-1">{a.activity_type}</div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setEditingLessonId(lesson.lesson_id)
                                                setEditingActivityId(a.activity_id)
                                                setShowActivityModal(true)
                                              }}
                                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white"
                                              title="Editar actividad"
                                            >
                                              <Edit3 className="w-4 h-4" />
                                              Editar
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
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

        {/* Configuración */}
        {activeTab === 'config' && (
          <div className="mt-6">
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Título *</label>
                  <input name="title" value={configData.title} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Descripción *</label>
                  <textarea name="description" value={configData.description} onChange={handleConfigChange} rows={6} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Categoría *</label>
                    <select name="category" value={configData.category} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                      <option value="ia">Inteligencia Artificial</option>
                      <option value="tecnologia">Tecnología</option>
                      <option value="negocios">Negocios</option>
                      <option value="diseño">Diseño</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Nivel *</label>
                    <select name="level" value={configData.level} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Duración (minutos) *</label>
                    <input type="number" name="duration_total_minutes" value={configData.duration_total_minutes} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                  </div>
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Precio</label>
                    <input type="number" step="0.01" name="price" value={configData.price} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">URL de Imagen</label>
                  <input name="thumbnail_url" value={configData.thumbnail_url} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <label className="block text-sm font-medium text-purple-200 mb-2">Slug (URL)</label>
                  <input name="slug" value={configData.slug} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-purple-200 font-semibold mb-3">Acciones</div>
                  <button type="submit" disabled={savingConfig} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-60">
                    {savingConfig ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Vista previa */}
        {activeTab === 'preview' && (
          <div className="mt-6">
            {previewLoading ? (
              <div className="text-center py-20 text-purple-200">Cargando vista previa...</div>
            ) : workshopPreview ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="rounded-2xl overflow-hidden border border-purple-800/30 bg-gray-900/40">
                    {workshopPreview.thumbnail_url ? (
                      <img src={workshopPreview.thumbnail_url} alt={workshopPreview.title} className="w-full h-64 object-cover" />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
                    )}
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-white">{workshopPreview.title}</h2>
                      <p className="mt-2 text-purple-200/80">{workshopPreview.description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6 space-y-4">
                    <div className="text-white font-semibold">Detalles</div>
                    <div className="text-sm text-purple-200/90">Nivel: {workshopPreview.level}</div>
                    <div className="text-sm text-purple-200/90">Duración: {workshopPreview.duration_total_minutes} min</div>
                    {workshopPreview.price > 0 && (
                      <div className="text-sm text-purple-200/90">Precio: ${workshopPreview.price}</div>
                    )}
                    <button
                      onClick={() => {
                        if (workshopPreview.slug) window.open(`/courses/${workshopPreview.slug}`, '_blank')
                      }}
                      className="w-full mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      Abrir página pública
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-purple-200">No se encontró el curso.</div>
            )}
          </div>
        )}

        {/* Estadísticas */}
        {activeTab === 'stats' && (
          <div className="mt-6 space-y-6">
            {statsLoading ? (
              <div className="text-center py-20 text-purple-200">Cargando estadísticas...</div>
            ) : (
              <>
                {/* Estadísticas del Curso */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-purple-300" />
                    Estadísticas del Curso
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Módulos</div>
                      <div className="text-3xl font-bold text-white">{modules.length}</div>
                      <div className="text-xs text-purple-400/60 mt-1">{modules.filter(m => m.is_published).length} publicados</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Lecciones</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_lessons ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Duración total</div>
                      <div className="text-3xl font-bold text-white">{modules.reduce((acc, m: any) => acc + (m.module_duration_minutes || 0), 0)} min</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Materiales</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_materials ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Actividades</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_activities ?? '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">{userStats?.completed_activities ?? 0} completadas</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Notas creadas</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_notes ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Usuarios */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-purple-300" />
                    Estadísticas de Usuarios
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Usuarios inscritos</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_enrolled ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">En progreso</div>
                      <div className="text-3xl font-bold text-white">{userStats?.in_progress ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Completados</div>
                      <div className="text-3xl font-bold text-white">{userStats?.completed ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">No iniciados</div>
                      <div className="text-3xl font-bold text-white">{userStats?.not_started ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Progreso promedio</div>
                      <div className="text-3xl font-bold text-white">{userStats ? `${Math.round(userStats.average_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Activos últimos 7 días</div>
                      <div className="text-3xl font-bold text-white">{userStats?.active_7d ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Activos últimos 30 días</div>
                      <div className="text-3xl font-bold text-white">{userStats?.active_30d ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Certificados emitidos</div>
                      <div className="text-3xl font-bold text-white">{userStats?.total_certificates ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas Financieras */}
                {(userStats?.total_purchases > 0 || userStats?.total_revenue_cents > 0) && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-300" />
                      Estadísticas Financieras
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Compras totales</div>
                        <div className="text-3xl font-bold text-white">{userStats?.total_purchases ?? '—'}</div>
                        <div className="text-xs text-purple-400/60 mt-1">{userStats?.active_purchases ?? 0} activas</div>
                      </div>
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Ingresos totales</div>
                        <div className="text-3xl font-bold text-green-400">{userStats?.total_revenue_display ?? '$0.00'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estadísticas de Reseñas */}
                {userStats?.total_reviews > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-300" />
                      Reseñas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Total de reseñas</div>
                        <div className="text-3xl font-bold text-white">{userStats?.total_reviews ?? '—'}</div>
                      </div>
                      <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                        <div className="text-sm text-purple-300/80 mb-2">Calificación promedio</div>
                        <div className="text-3xl font-bold text-yellow-400">{userStats?.average_rating ? `${userStats.average_rating.toFixed(1)} ⭐` : '—'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Análisis Estadístico Profundo */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Sigma className="w-5 h-5 text-purple-300" />
                    Análisis Estadístico Profundo
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Mediana de Progreso</div>
                      <div className="text-2xl font-bold text-white">{userStats?.median_progress ? `${Math.round(userStats.median_progress)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Valor central</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Desviación Estándar</div>
                      <div className="text-2xl font-bold text-white">{userStats?.std_deviation ?? '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Dispersión de datos</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Rango Intercuartílico</div>
                      <div className="text-2xl font-bold text-white">{userStats?.iqr_progress ? `${Math.round(userStats.iqr_progress)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Q3 - Q1</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Rango Total</div>
                      <div className="text-2xl font-bold text-white">
                        {userStats?.min_progress !== undefined && userStats?.max_progress !== undefined
                          ? `${Math.round(userStats.min_progress)}% - ${Math.round(userStats.max_progress)}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Primer Cuartil (Q1)</div>
                      <div className="text-2xl font-bold text-white">{userStats?.q1_progress ? `${Math.round(userStats.q1_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tercer Cuartil (Q3)</div>
                      <div className="text-2xl font-bold text-white">{userStats?.q3_progress ? `${Math.round(userStats.q3_progress)}%` : '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Varianza</div>
                      <div className="text-2xl font-bold text-white">{userStats?.variance ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tiempo Promedio de Finalización</div>
                      <div className="text-2xl font-bold text-white">{userStats?.avg_completion_days ? `${Math.round(userStats.avg_completion_days)} días` : '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Métricas de RRHH */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-300" />
                    Métricas de RRHH
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Retención</div>
                      <div className="text-3xl font-bold text-green-400">{userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Usuarios activos últimos 30 días</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Finalización</div>
                      <div className="text-3xl font-bold text-blue-400">{userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '—'}</div>
                      <div className="text-xs text-purple-400/60 mt-1">Completados / Inscritos</div>
                    </div>
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                      <div className="text-sm text-purple-300/80 mb-2">Tasa de Abandono</div>
                      <div className="text-3xl font-bold text-red-400">
                        {userStats?.retention_rate !== undefined 
                          ? `${(100 - userStats.retention_rate).toFixed(1)}%`
                          : '—'}
                      </div>
                      <div className="text-xs text-purple-400/60 mt-1">Usuarios inactivos</div>
                    </div>
                  </div>
                </div>

                {/* Gráficas Avanzadas */}
                {chartData && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-purple-300" />
                      Visualizaciones Avanzadas
                    </h2>
                    
                    {/* Gráfica de Tendencia de Inscripciones */}
                    {chartData.enrollment_trend && chartData.enrollment_trend.length > 0 && (
                      <EnrollmentTrendChart data={chartData.enrollment_trend} />
                    )}

                    {/* Gráfica de Distribución de Progreso */}
                    {chartData.progress_distribution && chartData.progress_distribution.length > 0 && (
                      <ProgressDistributionChart data={chartData.progress_distribution} />
                    )}

                    {/* Gráfica de Dispersión: Engagement */}
                    {chartData.engagement_data && chartData.engagement_data.length > 0 && (
                      <EngagementScatterChart data={chartData.engagement_data} />
                    )}

                    {/* Gráfica de Tasas de RRHH */}
                    {chartData.enrollment_rates && chartData.enrollment_rates.length > 0 && (
                      <CompletionRateChart data={chartData.enrollment_rates} />
                    )}

                    {/* Gráficas de pastel: Roles y Áreas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {chartData.user_roles_pie && chartData.user_roles_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_roles_pie} title="Distribución por Rol" />
                      )}
                      {chartData.user_areas_pie && chartData.user_areas_pie.length > 0 && (
                        <DonutPieChart data={chartData.user_areas_pie} title="Distribución por Área" />
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Usuarios Inscritos */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-300" />
                    Lista de Usuarios Inscritos
                  </h2>
                  {enrolledUsers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
                      No hay usuarios inscritos aún
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-purple-900/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Usuario</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Estado</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Progreso</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Inscrito</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Última actividad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-800/30">
                            {enrolledUsers.map((user: any) => (
                              <tr key={user.enrollment_id} className="hover:bg-purple-900/10 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    {user.profile_picture ? (
                                      <img src={user.profile_picture} alt={user.display_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-purple-700/40 flex items-center justify-center text-purple-200 font-semibold">
                                        {user.display_name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-white font-medium">{user.display_name}</div>
                                      <div className="text-xs text-purple-300/70">{user.email || user.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    user.enrollment_status === 'completed' ? 'bg-green-900/30 text-green-300 border border-green-700/40' :
                                    user.enrollment_status === 'active' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/40' :
                                    'bg-gray-800/50 text-gray-300 border border-gray-700/40'
                                  }`}>
                                    {user.enrollment_status === 'completed' ? 'Completado' :
                                     user.enrollment_status === 'active' ? 'Activo' :
                                     user.enrollment_status === 'paused' ? 'Pausado' :
                                     user.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-purple-900/30 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                                        style={{ width: `${user.progress_percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-purple-200 font-medium w-12 text-right">
                                      {Math.round(user.progress_percentage)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-purple-200">
                                  {user.enrolled_at ? new Date(user.enrolled_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-purple-200">
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

        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data) => {
              if (selectedModule) await updateModule(selectedModule.module_id, data)
              else await createModule(courseId, data)
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
              if (selectedLesson) await updateLesson(selectedLesson.lesson_id, data)
              else await createLesson(editingModuleId, data)
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            instructors={user ? [{ id: (user as any).id, name: (user as any).display_name || (user as any).username || (user as any).email }] : []}
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
            activity={editingActivityId ? activities.find(a => a.activity_id === editingActivityId) || null : null}
            lessonId={editingLessonId}
            onClose={() => {
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivityId(null)
            }}
            onSave={async (data) => {
              if (editingActivityId) {
                await updateActivity(editingActivityId, data)
              } else {
                await createActivity(editingLessonId, data)
              }
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivityId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default InstructorCourseManagementPage


