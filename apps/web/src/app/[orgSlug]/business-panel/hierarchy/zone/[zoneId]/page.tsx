'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  Edit,
  Trash2,
  Globe,
  User,
  Network,
  TrendingUp,
  ChevronRight,
  Camera,
  Loader2,
  BookOpen,
  BarChart3,
  Plus,
  MessageSquare
} from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { HierarchyService } from '@/features/business-panel/services/hierarchy.service'
import { uploadZoneLogo } from '@/features/business-panel/services/hierarchyUpload.service'
import { Zone, Team, ManagerInfo, HierarchyAnalytics, HierarchyCourse } from '@/features/business-panel/types/hierarchy.types'
import { useHierarchyAnalytics } from '@/features/business-panel/hooks/useHierarchyAnalytics'
import {
  ZoneForm,
  TeamForm,
  DeleteConfirmModal
} from '@/features/business-panel/components/hierarchy'
import { CourseSelectorModal } from '@/features/business-panel/components/hierarchy/CourseSelectorModal'
import { CourseAssignmentResultModal } from '@/features/business-panel/components/hierarchy/CourseAssignmentResultModal'
import { CourseAssignments, CourseAssignmentForm } from '@/features/business-panel/components/hierarchy'
import { HierarchyAssignmentsService } from '@/features/business-panel/services/hierarchy-assignments.service'
import { BusinessUsersService } from '@/features/business-panel/services/businessUsers.service'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { HierarchyChat } from '@/features/business-panel/components/hierarchy/HierarchyChat'

import HierarchyMapWrapper from '@/features/business-panel/components/hierarchy/HierarchyMapWrapper'

export default function ZoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  
  const orgSlug = params?.orgSlug as string
  const zoneId = params?.zoneId as string
  
  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  
  const [zone, setZone] = useState<Zone | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Hook para analíticas con actualización en tiempo real (polling cada 30s)
  const { analytics, isLoading: isLoadingAnalytics, mutate: refreshAnalytics } = useHierarchyAnalytics('zone', zoneId)
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'courses' | 'chat-horizontal' | 'chat-vertical'>('overview')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [availableManagers, setAvailableManagers] = useState<ManagerInfo[]>([])

  // Course assignment result modal
  const [assignmentResult, setAssignmentResult] = useState<{
    isOpen: boolean
    success: boolean
    message: string
    entityName: string
    totalUsers: number
    results: Array<{
      course_id: string
      course_title?: string
      success: boolean
      assigned_count?: number
      already_assigned_count?: number
      error?: string
      message?: string
    }>
  } | null>(null)

  // Courses state
  const [courses, setCourses] = useState<HierarchyCourse[]>([])

  // Toast notification state
  const [toast, setToast] = useState<{
    isOpen: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    message: '',
    type: 'error'
  })

  useEffect(() => {
    const loadManagers = async () => {
      const users = await BusinessUsersService.getOrganizationUsers()
      const managers = users
        .filter((u: any) => u.org_status === 'active')
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          display_name: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
          first_name: u.first_name || undefined,
          last_name: u.last_name || undefined,
          profile_picture_url: u.profile_picture_url || undefined
        }))
      setAvailableManagers(managers)
    }
    loadManagers()
  }, [])

  const handleUpdateZone = async (data: Partial<Zone>) => {
    if (!zone) return
    try {
      setIsLoading(true)
      console.log('💾 Guardando zona con datos:', {
        ...data,
        latitude: data.latitude,
        longitude: data.longitude
      })
      const result = await HierarchyService.updateZone(zone.id, data)
      if (result.success && result.data) {
        console.log('✅ Zona actualizada:', {
          name: result.data.name,
          latitude: result.data.latitude,
          longitude: result.data.longitude
        })
        setZone(result.data)
        setIsEditOpen(false)
        // Recargar datos para asegurar que todo esté actualizado
        await loadData()
        setToast({
          isOpen: true,
          message: 'Zona actualizada exitosamente',
          type: 'success'
        })
      } else {
        console.error('❌ Error al actualizar zona:', result.error)
        setToast({
          isOpen: true,
          message: 'Error al actualizar: ' + (result.error || 'Error desconocido'),
          type: 'error'
        })
      }
    } catch (err) {
      console.error('❌ Error en handleUpdateZone:', err)
      setToast({
        isOpen: true,
        message: 'Error al actualizar la zona',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteZone = async () => {
    if (!zone) return
    try {
      setIsLoading(true)
      const result = await HierarchyService.deleteZone(zone.id)
      if (result.success) {
        router.push(`/${orgSlug}/business-panel/hierarchy`)
      } else {
        setToast({
          isOpen: true,
          message: 'Error al eliminar: ' + (result.error || 'Error desconocido'),
          type: 'error'
        })
        setIsLoading(false)
      }
    } catch (err) {
      setToast({
        isOpen: true,
        message: 'Error al eliminar la zona',
        type: 'error'
      })
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (data: Partial<Team> & { zone_id: string }) => {
    try {
      setIsLoading(true)
      const result = await HierarchyService.createTeam(data as any)
      if (result.success && result.data) {
        setTeams([...teams, result.data])
        setIsNewTeamOpen(false)
        setToast({
          isOpen: true,
          message: 'Equipo creado exitosamente',
          type: 'success'
        })
      } else {
        setToast({
          isOpen: true,
          message: 'Error al crear equipo: ' + (result.error || 'Error desconocido'),
          type: 'error'
        })
      }
    } catch (err) {
      setToast({
        isOpen: true,
        message: 'Error al crear equipo',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !zone) return

    setIsUploading(true)
    try {
      const result = await uploadZoneLogo(zoneId, file)
      
      if (result.success && result.url) {
        await HierarchyService.updateZone(zoneId, { logo_url: result.url } as any)
        setZone({ ...zone, logo_url: result.url } as any)
      } else {
        console.error('Upload failed:', result.error)
        setToast({
          isOpen: true,
          message: 'Error al subir la imagen: ' + (result.error || 'Error desconocido'),
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setToast({
        isOpen: true,
        message: 'Error al subir la imagen',
        type: 'error'
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAssignCourses = async (courseIds: string[]) => {
    if (!zone) return
    
    try {
      setIsLoading(true)
      const result = await HierarchyAssignmentsService.createAssignment({
        entity_type: 'zone',
        entity_id: zone.id,
        course_ids: courseIds
      })
      
      if (result.success && result.data) {
        // Recargar cursos para mostrar los nuevos desde la BD
        await loadData()
        
        const totalAssigned = result.data.results.reduce((acc: number, r: any) => acc + (r.assigned_count || 0), 0)
        const totalUsers = result.data.total_users
        
        // Mostrar modal de éxito
        setAssignmentResult({
          isOpen: true,
          success: true,
          message: `${totalAssigned} curso(s) asignado(s) exitosamente a ${totalUsers} usuario(s) en la zona ${result.data.entity_name}`,
          entityName: result.data.entity_name,
          totalUsers: result.data.total_users,
          results: result.data.results
        })
        setIsCourseModalOpen(false)
      } else {
        // Mostrar modal de error
        setAssignmentResult({
          isOpen: true,
          success: false,
          message: result.error || 'Error desconocido al asignar cursos',
          entityName: zone.name,
          totalUsers: 0,
          results: []
        })
      }
    } catch (error: any) {
      console.error('Error asignando cursos:', error)
      // Mostrar modal de error
      setAssignmentResult({
        isOpen: true,
        success: false,
        message: error.message || 'Error desconocido al asignar cursos',
        entityName: zone.name,
        totalUsers: 0,
        results: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAssignmentForm = () => {
    setEditingAssignment(null)
    setIsAssignmentFormOpen(true)
  }

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment)
    setIsAssignmentFormOpen(true)
  }

  const handleAssignmentSuccess = async () => {
    await loadData()
    setIsAssignmentFormOpen(false)
    setEditingAssignment(null)
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Analytics se carga automáticamente con el hook useHierarchyAnalytics
      const [zoneData, teamsData, coursesData] = await Promise.all([
        HierarchyService.getZone(zoneId),
        HierarchyService.getTeams({ zoneId, withCounts: true, withLeader: true }),
        HierarchyService.getEntityCourses('zone', zoneId)
      ])
      setZone(zoneData)
      setTeams(teamsData)
      setCourses(coursesData)
      // Refrescar analytics manualmente después de cargar otros datos
      refreshAnalytics()
      
      // Debug: Log zona cargada
      console.log('📍 Zona cargada:', {
        name: zoneData?.name,
        latitude: zoneData?.latitude,
        longitude: zoneData?.longitude,
        hasCoords: zoneData?.latitude != null && zoneData?.longitude != null
      })
    } catch (err) {
      console.error('❌ Error cargando datos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (zoneId) {
      loadData()
    }
  }, [zoneId])

  const mapPoints = teams
    .filter(t => t.latitude != null && t.longitude != null && !isNaN(Number(t.latitude)) && !isNaN(Number(t.longitude)))
    .map(t => ({
      id: t.id,
      name: t.name,
      lat: Number(t.latitude),
      lng: Number(t.longitude),
      isTopPerformer: analytics?.top_performer?.id === t.id,
      stats: {
        value: t.members_count || 0,
        label: 'Miembros'
      }
    }))

  if (isLoading && !zone) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
      </div>
    )
  }

  if (!zone) return null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Main Banner */}
      <div 
        className="rounded-3xl overflow-hidden relative border border-white/10"
        style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
      >
        <div 
          className="absolute inset-x-0 top-0 h-32 opacity-30"
          style={{ background: `linear-gradient(180deg, ${primaryColor}, transparent)` }}
        />

        <div className="relative p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative shrink-0">
              <button
                onClick={handleLogoClick}
                disabled={isUploading}
                className="relative w-36 h-36 group cursor-pointer transition-all duration-300 hover:scale-110 active:scale-100"
                style={{ 
                  filter: `drop-shadow(0 10px 25px ${primaryColor}60)`,
                }}
                title="Click para cambiar logo"
              >
                {(zone as any).logo_url ? (
                  <Image
                    src={(zone as any).logo_url}
                    alt={zone.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10 dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:border-white/10"
                  >
                    <Building2 className="w-16 h-16 text-gray-400 dark:text-white/20" />
                  </div>
                )}
                
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-10 h-10 text-white drop-shadow-md" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
            </div>

            <div className="flex-1 min-w-0 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {zone.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-white/60">
                    {zone.code && (
                      <span className="bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md text-sm font-mono border border-gray-200 dark:border-white/5 text-gray-700 dark:text-white">
                        {zone.code}
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        zone.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}
                    >
                      {zone.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    {(zone.city || zone.country) && (
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-white/60">
                        <Globe className="w-4 h-4 text-gray-500 dark:opacity-50" />
                        {[zone.city, zone.state, zone.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
                    title="Editar Zona"
                  >
                    <Edit className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white" />
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group"
                    title="Eliminar Zona"
                  >
                    <Trash2 className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</p>
                    <p className="text-xs text-gray-600 dark:text-white/50">Equipos</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.users_count || teams.reduce((acc, t) => acc + (t.members_count || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-white/50">Usuarios</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div className="flex items-center px-8 border-t border-white/10 overflow-x-auto">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="w-4 h-4" />}
          >
            Visión General
          </TabButton>
          <TabButton 
            active={activeTab === 'structure'} 
            onClick={() => setActiveTab('structure')}
            icon={<Network className="w-4 h-4" />}
          >
            Equipos y Mapa
          </TabButton>
          <TabButton 
            active={activeTab === 'courses'} 
            onClick={() => setActiveTab('courses')}
            icon={<BookOpen className="w-4 h-4" />}
          >
            Cursos y Aprendizaje
          </TabButton>
          <TabButton 
            active={activeTab === 'chat-horizontal'} 
            onClick={() => setActiveTab('chat-horizontal')}
            icon={<Users className="w-4 h-4" />}
          >
            Chat entre Pares
          </TabButton>
          <TabButton 
            active={activeTab === 'chat-vertical'} 
            onClick={() => setActiveTab('chat-vertical')}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            Chat con Equipo
          </TabButton>
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div 
              className="lg:col-span-1 p-6 rounded-2xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500 dark:text-white/60" />
                Gerente de Zona
              </h3>
              
              {zone.manager ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {zone.manager.profile_picture_url ? (
                      <>
                        <Image
                          src={zone.manager.profile_picture_url}
                          alt={zone.manager.display_name || ''}
                          fill
                          className="rounded-full object-cover border-4 border-white/5"
                        />
                        {/* Círculo indicador */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1E2329] dark:border-[#1E2329]"></div>
                      </>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white/5 relative">
                        <User className="w-12 h-12 text-white" />
                        {/* Círculo indicador */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1E2329] dark:border-[#1E2329]"></div>
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{zone.manager.display_name}</h4>
                  <p className="text-white/50 text-sm mb-6">{zone.manager.email}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">Teléfono</p>
                      <p className="text-sm font-medium text-white break-all">
                        {zone.phone || 'No registrado'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">Email Contacto</p>
                      <p className="text-sm font-medium text-white break-all">
                        {zone.email || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-white/30">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:opacity-20" />
                  <p>Sin gerente asignado</p>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Asignar en edición
                  </button>
                </div>
              )}
            </div>

            <div 
              className="lg:col-span-2 p-6 rounded-2xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-600 dark:text-white/60" />
                Métricas de Rendimiento (Tiempo Real)
              </h3>

              {/* Métricas Principales - Lista */}
              <div className="mb-8">
                <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Tasa de Finalización</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Promedio</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_completion || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Horas de Aprendizaje</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Total ACUM</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.total_hours || 0}h</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Usuarios Activos</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">de {analytics?.users_count || 0}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.active_learners || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Equipos Activos</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">de {analytics?.total_teams || 0}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.active_teams || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Tasa de Participación</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">General</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.participation_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Tasa de Completitud</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">Asignaciones</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.assignment_completion_rate || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Top Performer Mejorado */}
              {analytics?.top_performer && (
                 <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-amber-400 font-medium">🏆 Mejor Equipo de la Zona</p>
                      <p className="text-xl font-bold text-white">{analytics.top_performer.name}</p>
                      <p className="text-xs text-white/50">{analytics.top_performer.value} horas registradas de aprendizaje</p>
                    </div>
                 </div>
              )}

              {/* Métricas Detalladas - Lista */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-white/60" />
                  Métricas Detalladas
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-white/80">Horas promedio por equipo</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Promedio</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_hours_per_team?.toFixed(1) || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-white/80">Horas promedio por miembro</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Promedio</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_hours_per_member?.toFixed(1) || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-white/80">Cursos completados totales</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">Total</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.courses_completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-white/80">Asignaciones vencidas</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">Atención</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">{analytics?.assignments_overdue || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-white/80">Equipos inactivos</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">Inactivos</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">{analytics?.inactive_teams || 0}</span>
                    </div>
                  </div>
                  
                  {/* Ranking de Equipos */}
                  {analytics?.team_ranking && analytics.team_ranking.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Ranking de Equipos (Top 5)</h4>
                      <div className="space-y-2">
                        {analytics.team_ranking.map((team: any, index: number) => (
                          <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-white/5 border-b border-gray-200 dark:border-white/5 last:border-b-0">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-500 dark:text-white/60">#{index + 1}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</p>
                                <p className="text-xs text-gray-600 dark:text-white/50">{team.hours}h • {Math.round(team.completion_rate)}% completitud</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-white/40">{Math.round(team.participation_rate)}% participación</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Actividad */}
              <div className="h-48 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-white/40">Gráfico de actividad semanal</p>
                  <p className="text-xs text-gray-400 dark:text-white/20 mt-1">(Comparativa entre equipos)</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'structure' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 overflow-hidden" 
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-gray-500 dark:text-white/40" />
                Equipos y Distribución
              </h2>
              <button
                onClick={() => setIsNewTeamOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center gap-2 drop-shadow-md"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
              >
                <Plus className="w-4 h-4" />
                Nuevo Equipo
              </button>
            </div>
            
            {/* Map Section */}
            {mapPoints.length > 0 ? (
               <div className="p-1">
                 <HierarchyMapWrapper points={mapPoints} />
                 <div className="px-6 py-2 text-xs text-gray-600 dark:text-white/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Equipo Estándar
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-4"></span> Equipo Destacado (Top Performer)
                 </div>
               </div>
            ) : (
               <div className="p-6 text-center text-gray-500 dark:text-white/40 border-b border-gray-200 dark:border-white/10">
                 <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:opacity-20" />
                 <p>No hay ubicaciones geográficas registradas para los equipos.</p>
                 <p className="text-xs mt-1">Configura la ubicación en cada equipo para verlos en el mapa.</p>
               </div>
            )}
            
            <div className="p-6">
               <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Listado de Equipos ({teams.length})</h3>
               {teams.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 dark:text-white/40">
                   <p>No hay equipos registrados</p>
                   <button
                    onClick={() => setIsNewTeamOpen(true)}
                    className="mt-4 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-700 dark:text-white transition-colors"
                   >
                     Crear primer equipo
                   </button>
                 </div>
               ) : (
                 <div className="divide-y divide-gray-200 dark:divide-white/5">
                   {teams.map((team) => (
                     <div key={team.id} className="py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors px-4 -mx-4 rounded-xl group">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gradient-to-br dark:from-white/10 dark:to-transparent border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 relative">
                             <Network className="w-6 h-6 text-gray-400 dark:text-white/40" />
                             {analytics?.top_performer?.id === team.id && (
                               <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-[#1E2329]" title="Top Performer" />
                             )}
                           </div>
                           <div>
                             <Link href={`/${orgSlug}/business-panel/hierarchy/team/${team.id}`} className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                               <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{team.name}</h4>
                               {analytics?.top_performer?.id === team.id && (
                                  <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full font-bold">Top</span>
                               )}
                             </Link>
                             <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/50">
                               {team.code && <span className="font-mono text-xs bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-700 dark:text-white">{team.code}</span>}
                               <span className="text-gray-400 dark:text-white/30">•</span>
                               <span>Líder: {team.leader ? team.leader.display_name : 'N/A'}</span>
                               <span className="text-gray-400 dark:text-white/30">•</span>
                               <span>{team.members_count || 0} miembros</span>
                             </div>
                           </div>
                         </div>
                         
                         <Link 
                           href={`/${orgSlug}/business-panel/hierarchy/team/${team.id}`}
                           className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white transition-colors"
                         >
                           <ChevronRight className="w-5 h-5" />
                         </Link>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'courses' && zone && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <CourseAssignments
              entityType="zone"
              entityId={zone.id}
              entityName={zone.name}
              onAssign={handleOpenAssignmentForm}
              onEdit={handleEditAssignment}
              onCancel={handleAssignmentSuccess}
            />
          </motion.div>
        )}

        {activeTab === 'chat-horizontal' && zone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] rounded-2xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <HierarchyChat
              entityType="zone"
              entityId={zone.id}
              chatType="horizontal"
              title="Chat entre Gerentes de Zona"
            />
          </motion.div>
        )}

        {activeTab === 'chat-vertical' && zone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] rounded-2xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <HierarchyChat
              entityType="zone"
              entityId={zone.id}
              chatType="vertical"
              title="Chat con Líderes de Equipo"
            />
          </motion.div>
        )}
      </div>

      {zone && (
        <ZoneForm
          zone={zone}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleUpdateZone}
          isLoading={isLoading}
          availableManagers={availableManagers}
          regions={[]}
        />
      )}

      {zone && (
        <TeamForm
          isOpen={isNewTeamOpen}
          onClose={() => setIsNewTeamOpen(false)}
          onSave={handleCreateTeam}
          isLoading={isLoading}
          availableLeaders={availableManagers}
          selectedZoneId={zone.id}
          zones={[zone]}
        />
      )}

      {zone && (
        <CourseAssignmentForm
          isOpen={isAssignmentFormOpen}
          onClose={() => {
            setIsAssignmentFormOpen(false)
            setEditingAssignment(null)
          }}
          entityType="zone"
          entityId={zone.id}
          entityName={zone.name}
          assignment={editingAssignment}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      <CourseSelectorModal 
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSelect={handleAssignCourses}
        title={`Asignar a Zona ${zone.name}`}
      />

      {assignmentResult && (
        <CourseAssignmentResultModal
          isOpen={assignmentResult.isOpen}
          onClose={() => setAssignmentResult(null)}
          success={assignmentResult.success}
          message={assignmentResult.message}
          entityName={assignmentResult.entityName}
          totalUsers={assignmentResult.totalUsers}
          results={assignmentResult.results}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteZone}
        title="Eliminar Zona"
        message="¿Estás seguro de que deseas eliminar esta zona? Se eliminarán todos los equipos asociados."
        itemName={zone.name}
        isLoading={isLoading}
      />

      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'error' ? 6000 : 4000}
      />
    </div>
  )
}

// Subcomponents REUSED
function TabButton({ active, children, onClick, icon }: { active: boolean; children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
        ${active 
          ? 'border-blue-500 text-blue-600 dark:text-white' 
          : 'border-transparent text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30'}
      `}
    >
      {icon}
      {children}
    </button>
  )
}

function MetricCard({ label, value, trend, trendUp, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
  }
  
  return (
    <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-600 dark:text-white/40 text-xs uppercase tracking-wider">{label}</p>
        <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${colors[color].split(' ')[0]}`} />
    </div>
  )
}

function CourseCard({ title, category, students, progress, image }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2329] overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col h-full shadow-sm">
      <div className="h-40 bg-gray-200 dark:bg-neutral-800 relative overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-900 dark:to-slate-900">
             <BookOpen className="w-10 h-10 text-gray-400 dark:text-white/20" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-white border border-gray-200 dark:border-white/10">
          En curso
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col bg-white dark:bg-[#1E2329]">
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{category}</div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2">{title}</h3>
        
        <div className="mt-auto pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/60">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{students} inscritos</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-white/50">
              <span>Progreso promedio</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
