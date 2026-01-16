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
  Mail,
  MoreVertical,
  MessageSquare
} from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { HierarchyService } from '@/features/business-panel/services/hierarchy.service'
import { uploadTeamLogo } from '@/features/business-panel/services/hierarchyUpload.service'
import { Team, UserWithHierarchy, ManagerInfo, HierarchyAnalytics, HierarchyCourse } from '@/features/business-panel/types/hierarchy.types'
import { useHierarchyAnalytics } from '@/features/business-panel/hooks/useHierarchyAnalytics'
import {
  TeamForm,
  DeleteConfirmModal
} from '@/features/business-panel/components/hierarchy'
import { CourseSelectorModal } from '@/features/business-panel/components/hierarchy/CourseSelectorModal'
import { CourseAssignmentResultModal } from '@/features/business-panel/components/hierarchy/CourseAssignmentResultModal'
import { CourseAssignments, CourseAssignmentForm } from '@/features/business-panel/components/hierarchy'
import { HierarchyAssignmentsService } from '@/features/business-panel/services/hierarchy-assignments.service'
import { TeamMembersModal } from '@/features/business-panel/components/hierarchy/TeamMembersModal'
import { BusinessUsersService } from '@/features/business-panel/services/businessUsers.service'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { HierarchyChat } from '@/features/business-panel/components/hierarchy/HierarchyChat'

import HierarchyMapWrapper from '@/features/business-panel/components/hierarchy/HierarchyMapWrapper'

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  
  const orgSlug = params?.orgSlug as string
  const teamId = params?.teamId as string
  
  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<UserWithHierarchy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Hook para analíticas con actualización en tiempo real (polling cada 30s)
  const { analytics, isLoading: isLoadingAnalytics, mutate: refreshAnalytics } = useHierarchyAnalytics('team', teamId)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'courses' | 'chat-horizontal' | 'chat-vertical'>('overview')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [availableLeaders, setAvailableLeaders] = useState<ManagerInfo[]>([])

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
    const loadLeaders = async () => {
      const users = await BusinessUsersService.getOrganizationUsers()
      const leaders = users
        .filter(u => u.org_status === 'active')
        .map(u => ({
          id: u.id,
          email: u.email,
          display_name: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
          first_name: u.first_name || undefined,
          last_name: u.last_name || undefined,
          profile_picture_url: u.profile_picture_url || undefined
        }))
      setAvailableLeaders(leaders)
    }
    loadLeaders()
  }, [])

  const handleUpdateTeam = async (data: Partial<Team>) => {
    if (!team) return
    try {
      setIsLoading(true)
      const result = await HierarchyService.updateTeam(team.id, data)
      if (result.success && result.data) {
        setTeam(result.data)
        setIsEditOpen(false)
        setToast({
          isOpen: true,
          message: 'Equipo actualizado exitosamente',
          type: 'success'
        })
      } else {
        setToast({
          isOpen: true,
          message: 'Error al actualizar: ' + (result.error || 'Error desconocido'),
          type: 'error'
        })
      }
    } catch (err) {
      setToast({
        isOpen: true,
        message: 'Error al actualizar el equipo',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!team) return
    try {
      setIsLoading(true)
      const result = await HierarchyService.deleteTeam(team.id)
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
        message: 'Error al eliminar el equipo',
        type: 'error'
      })
      setIsLoading(false)
    }
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !team) return

    setIsUploading(true)
    try {
      const result = await uploadTeamLogo(teamId, file)
      
      if (result.success && result.url) {
        await HierarchyService.updateTeam(teamId, { logo_url: result.url } as any)
        setTeam({ ...team, logo_url: result.url } as any)
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

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Analytics se carga automáticamente con el hook useHierarchyAnalytics
      const [teamData, membersData, coursesData] = await Promise.all([
        HierarchyService.getTeam(teamId),
        HierarchyService.getTeamMembers(teamId),
        HierarchyService.getEntityCourses('team', teamId)
      ])
      setTeam(teamData)
      setMembers(membersData)
      setCourses(coursesData)
      // Refrescar analytics manualmente después de cargar otros datos
      refreshAnalytics()
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignCourses = async (courseIds: string[]) => {
    if (!team) return
    
    try {
      setIsLoading(true)
      const result = await HierarchyAssignmentsService.createAssignment({
        entity_type: 'team',
        entity_id: team.id,
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
          message: `${totalAssigned} curso(s) asignado(s) exitosamente a ${totalUsers} usuario(s) en el equipo ${result.data.entity_name}`,
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
          entityName: team.name,
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
        entityName: team.name,
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

  useEffect(() => {
    if (teamId) {
      loadData()
    }
  }, [teamId])

  // Single point map for team
  const mapPoints = team && team.latitude && team.longitude 
    ? [{
        id: team.id,
        name: team.name,
        lat: Number(team.latitude),
        lng: Number(team.longitude),
        isTopPerformer: false,
        stats: {
          value: members.length,
          label: 'Miembros'
        }
      }]
    : []

  if (isLoading && !team) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
      </div>
    )
  }

  if (!team) return null

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
        className="rounded-3xl overflow-hidden relative border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2329]"
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
                {(team as any).logo_url ? (
                  <Image
                    src={(team as any).logo_url}
                    alt={team.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10 dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:border-white/10"
                  >
                    <Users className="w-16 h-16 text-gray-400 dark:text-white/20" />
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
                    {team.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-white/60">
                    {team.code && (
                      <span className="bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md text-sm font-mono border border-gray-200 dark:border-white/5 text-gray-700 dark:text-white">
                        {team.code}
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        team.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}
                    >
                      {team.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {(team.city || team.country) && (
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-white/60">
                        <Globe className="w-4 h-4 text-gray-500 dark:opacity-50" />
                        {[team.city, team.state, team.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
                    title="Editar Equipo"
                  >
                    <Edit className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white" />
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group"
                    title="Eliminar Equipo"
                  >
                    <Trash2 className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
                    <p className="text-xs text-gray-600 dark:text-white/50">Miembros</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.avg_completion || 0}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-white/50">Progreso</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div className="flex items-center px-8 border-t border-gray-200 dark:border-white/10 overflow-x-auto">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="w-4 h-4" />}
          >
            Visión General
          </TabButton>
          <TabButton 
            active={activeTab === 'members'} 
            onClick={() => setActiveTab('members')}
            icon={<Users className="w-4 h-4" />}
          >
            Miembros
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
                Líder de Equipo
              </h3>
              
              {team.leader ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {team.leader.profile_picture_url ? (
                      <Image
                        src={team.leader.profile_picture_url}
                        alt={team.leader.display_name || ''}
                        fill
                        className="rounded-full object-cover border-4 border-white/5"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white/5 relative">
                        <User className="w-12 h-12 text-white" />
                        {/* Círculo indicador */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1E2329] dark:border-[#1E2329]"></div>
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{team.leader.display_name}</h4>
                  <p className="text-gray-600 dark:text-white/50 text-sm mb-6">{team.leader.email}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                      <p className="text-xs text-gray-600 dark:text-white/40 mb-1">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                        {team.phone || 'No registrado'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                      <p className="text-xs text-gray-600 dark:text-white/40 mb-1">Email Contacto</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                        {team.email || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-white/30">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:opacity-20" />
                  <p>Sin líder asignado</p>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Asignar en edición
                  </button>
                </div>
              )}
            
               {/* Team Map Location */}
               {mapPoints.length > 0 && (
                 <div className="mt-6 border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/40" />
                      Ubicación del Equipo
                    </h4>
                    <div className="h-48 rounded-xl overflow-hidden relative z-0">
                       <HierarchyMapWrapper points={mapPoints} zoom={13} />
                    </div>
                 </div>
               )}
            </div>

            <div 
              className="lg:col-span-2 p-6 rounded-2xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500 dark:text-white/60" />
                Rendimiento del Equipo (Tiempo Real)
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
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">de {analytics?.users_count || members.length}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.active_learners || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Tasa de Participación</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">Activos</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.participation_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Cursos Completados</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">Total</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.courses_completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Completitud Asignaciones</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">Tasa</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.assignment_completion_rate || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Top Performer Mejorado */}
              {analytics?.top_performer && (
                 <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                       <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-amber-400 font-medium">🏆 Mejor Empleado del Equipo</p>
                      <p className="text-xl font-bold text-white">{analytics.top_performer.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-white/60">
                        <span>⏱️ {analytics.top_performer.value} horas</span>
                        {analytics.top_performer.courses_completed !== undefined && (
                          <span>📚 {analytics.top_performer.courses_completed} cursos</span>
                        )}
                        {analytics.top_performer.completion_rate !== undefined && (
                          <span>✅ {Math.round(analytics.top_performer.completion_rate)}% completitud</span>
                        )}
                      </div>
                    </div>
                 </div>
              )}

              {/* Métricas Detalladas - Lista */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-white/60" />
                  Métricas Detalladas
                </h4>
                <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Horas promedio por miembro</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Promedio</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_hours_per_member?.toFixed(1) || 0}h</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Lecciones completadas</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">Total</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.lessons_completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Cursos en progreso</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">Activos</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.courses_in_progress || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Cursos no iniciados</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400">Pendientes</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.courses_not_started || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Asignaciones vencidas</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">Atención</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{analytics?.assignments_overdue || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Próximas a vencer (7 días)</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">Próximas</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{analytics?.assignments_due_soon || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Días activos promedio</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">Últimos 30 días</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_active_days?.toFixed(1) || 0} días</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Racha promedio</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">Promedio</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_streak?.toFixed(1) || 0} días</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Racha más larga</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">Máximo</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.longest_streak || 0} días</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Sesiones completadas</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">Total</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.sessions_completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Sesiones perdidas</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">Últimos 30 días</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{analytics?.sessions_missed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-white/80">Tiempo promedio por sesión</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Promedio</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.avg_session_duration?.toFixed(1) || 0} min</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Actividad */}
              <div className="h-48 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-white/40">Gráfico de actividad semanal</p>
                  <p className="text-xs text-gray-400 dark:text-white/20 mt-1">(Datos en tiempo real)</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 overflow-hidden" 
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500 dark:text-white/40" />
                Miembros del Equipo
              </h2>
              <button 
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                onClick={() => setIsMembersModalOpen(true)}
              >
                Gestionar Usuarios
              </button>
            </div>
            
            <div className="p-6">
               {members.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 dark:text-white/40">
                   <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:opacity-20" />
                   <p>Este equipo no tiene miembros asignados aún.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-gray-200 dark:divide-white/5">
                   {members.map((member) => (
                     <div key={member.id} className="py-4 flex items-center justify-between group px-2 -mx-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                       <div className="flex items-center gap-4">
                         <div className="relative w-10 h-10">
                           {member.user?.profile_picture_url ? (
                             <Image
                               src={member.user.profile_picture_url}
                               alt=""
                               fill
                               className="rounded-full object-cover"
                             />
                           ) : (
                             <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                               {member.user?.display_name?.charAt(0) || member.user?.email.charAt(0)}
                             </div>
                           )}
                           {analytics?.top_performer?.id === member.user_id && (
                             <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1 rounded-full border border-white dark:border-[#1E2329]">
                               Top
                             </div>
                           )}
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                             {member.user?.display_name || member.user?.email}
                             {member.role === 'team_leader' && (
                               <span className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">Líder</span>
                             )}
                           </h4>
                           <p className="text-sm text-gray-600 dark:text-white/50">{member.job_title || 'Sin cargo'}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4 text-gray-500 dark:text-white/40">
                         <div className="text-right hidden sm:block">
                           <p className="text-xs text-gray-500 dark:text-white/40">Ubicación</p>
                           <p className="text-sm text-gray-700 dark:text-white/70">
                              {member.region_name || 'N/A'} • {member.zone_name || 'N/A'}
                           </p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && team && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <CourseAssignments
              entityType="team"
              entityId={team.id}
              entityName={team.name}
              onAssign={handleOpenAssignmentForm}
              onEdit={handleEditAssignment}
              onCancel={handleAssignmentSuccess}
            />
          </motion.div>
        )}

        {activeTab === 'chat-horizontal' && team && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] rounded-2xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <HierarchyChat
              entityType="team"
              entityId={team.id}
              chatType="horizontal"
              title="Chat entre Líderes de Equipo"
            />
          </motion.div>
        )}

        {activeTab === 'chat-vertical' && team && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] rounded-2xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
          >
            <HierarchyChat
              entityType="team"
              entityId={team.id}
              chatType="vertical"
              title="Chat con Miembros del Equipo"
            />
          </motion.div>
        )}
      </div>

      {team && (
        <TeamForm
          team={team}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleUpdateTeam}
          isLoading={isLoading}
          availableLeaders={availableLeaders}
          zones={[]} // Not needed for edit if we don't allow changing zones here, strictly
        />
      )}

      {team && (
        <CourseAssignmentForm
          isOpen={isAssignmentFormOpen}
          onClose={() => {
            setIsAssignmentFormOpen(false)
            setEditingAssignment(null)
          }}
          entityType="team"
          entityId={team.id}
          entityName={team.name}
          assignment={editingAssignment}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      <CourseSelectorModal 
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSelect={handleAssignCourses}
        title={`Asignar a Equipo ${team.name}`}
      />

      {team && (
        <TeamMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          teamId={team.id}
          teamName={team.name}
          currentMembers={members}
          onMembersUpdated={loadData}
        />
      )}

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
        onConfirm={handleDeleteTeam}
        title="Eliminar Equipo"
        message="¿Estás seguro de que deseas eliminar este equipo? Sus miembros quedarán sin asignar."
        itemName={team.name}
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
