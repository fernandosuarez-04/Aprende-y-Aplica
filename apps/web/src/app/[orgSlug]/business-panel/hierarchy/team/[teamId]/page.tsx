'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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
  MoreVertical
} from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { HierarchyService } from '@/features/business-panel/services/hierarchy.service'
import { uploadTeamLogo } from '@/features/business-panel/services/hierarchyUpload.service'
import { Team, UserWithHierarchy, ManagerInfo, HierarchyAnalytics, HierarchyCourse } from '@/features/business-panel/types/hierarchy.types'
import {
  TeamForm,
  DeleteConfirmModal
} from '@/features/business-panel/components/hierarchy'
import { CourseSelectorModal } from '@/features/business-panel/components/hierarchy/CourseSelectorModal'
import { BusinessUsersService } from '@/features/business-panel/services/businessUsers.service'

const HierarchyMap = dynamic(
  () => import('@/features/business-panel/components/hierarchy/HierarchyMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[300px] w-full rounded-2xl bg-[#1E2329] border border-white/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    )
  }
)

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
  const [analytics, setAnalytics] = useState<HierarchyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'courses'>('overview')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [availableLeaders, setAvailableLeaders] = useState<ManagerInfo[]>([])

  // Courses state
  const [courses, setCourses] = useState<HierarchyCourse[]>([])
  const [assignedCourses, setAssignedCourses] = useState<any[]>([])

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
      } else {
        alert('Error al actualizar: ' + result.error)
      }
    } catch (err) {
      alert('Error al actualizar el equipo')
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
        alert('Error al eliminar: ' + result.error)
        setIsLoading(false)
      }
    } catch (err) {
      alert('Error al eliminar el equipo')
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
        alert('Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Error al subir la imagen')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAssignCourses = (courseIds: string[]) => {
    console.log('Assigning courses:', courseIds)
    setAssignedCourses(prev => [...prev, ...courseIds.map(id => ({ id, title: 'Curso Asignado (Simulado)', progress: 0 }))])
    alert(`Se asignaron ${courseIds.length} cursos al equipo (Simulación)`)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [teamData, membersData, analyticsData, coursesData] = await Promise.all([
          HierarchyService.getTeam(teamId),
          HierarchyService.getTeamMembers(teamId),
          HierarchyService.getVisualAnalytics('team', teamId),
          HierarchyService.getEntityCourses('team', teamId)
        ])
        setTeam(teamData)
        setMembers(membersData)
        setAnalytics(analyticsData)
        setCourses(coursesData)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
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
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
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
                {(team as any).logo_url ? (
                  <Image
                    src={(team as any).logo_url}
                    alt={team.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
                  >
                    <Users className="w-16 h-16 text-white/20" />
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
                  <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                    {team.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/60">
                    {team.code && (
                      <span className="bg-white/5 px-2 py-1 rounded-md text-sm font-mono border border-white/5">
                        {team.code}
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        team.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {team.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {(team.city || team.country) && (
                      <span className="flex items-center gap-1 text-sm">
                        <Globe className="w-4 h-4 opacity-50" />
                        {[team.city, team.state, team.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                    title="Editar Equipo"
                  >
                    <Edit className="w-5 h-5 text-white/60 group-hover:text-white" />
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 transition-colors group"
                    title="Eliminar Equipo"
                  >
                    <Trash2 className="w-5 h-5 text-white/60 group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{members.length}</p>
                    <p className="text-xs text-white/50">Miembros</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics?.avg_completion || 0}%
                    </p>
                    <p className="text-xs text-white/50">Progreso</p>
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
                <User className="w-5 h-5 text-white/60" />
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
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white/5">
                        {team.leader.display_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{team.leader.display_name}</h4>
                  <p className="text-white/50 text-sm mb-6">{team.leader.email}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">Teléfono</p>
                      <p className="text-sm font-medium text-white break-all">
                        {team.phone || 'No registrado'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">Email Contacto</p>
                      <p className="text-sm font-medium text-white break-all">
                        {team.email || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-white/30">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Sin líder asignado</p>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
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
                       <HierarchyMap points={mapPoints} zoom={13} />
                    </div>
                 </div>
               )}
            </div>

            <div 
              className="lg:col-span-2 p-6 rounded-2xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/60" />
                Rendimiento del Equipo (Tiempo Real)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <MetricCard 
                  label="Tasa de Finalización"
                  value={`${analytics?.avg_completion || 0}%`}
                  trend="Promedio"
                  trendUp={true}
                  color="emerald"
                />
                <MetricCard 
                  label="Horas de Aprendizaje"
                  value={`${analytics?.total_hours || 0}h`}
                  trend="Total ACUM"
                  trendUp={true}
                  color="blue"
                />
                <MetricCard 
                  label="Usuarios Activos"
                  value={analytics?.active_learners || 0}
                  trend={`de ${members.length}`}
                  trendUp={true}
                  color="purple"
                />
              </div>

              {analytics?.top_performer && (
                 <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                       <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-400 font-medium">🏆 Empleado del mes</p>
                      <p className="text-xl font-bold text-white">{analytics.top_performer.name}</p>
                      <p className="text-xs text-white/50">{analytics.top_performer.value} horas de aprendizaje</p>
                    </div>
                 </div>
              )}
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
                <Users className="w-5 h-5 text-white/40" />
                Miembros del Equipo
              </h2>
              <button 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => router.push(`/${orgSlug}/business-panel/users`)}
              >
                Gestionar Usuarios
              </button>
            </div>
            
            <div className="p-6">
               {members.length === 0 ? (
                 <div className="text-center py-10 text-white/40">
                   <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p>Este equipo no tiene miembros asignados aún.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-white/5">
                   {members.map((member) => (
                     <div key={member.id} className="py-4 flex items-center justify-between group px-2 -mx-2 hover:bg-white/5 rounded-xl transition-colors">
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
                             <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1 rounded-full border border-[#1E2329]">
                               Top
                             </div>
                           )}
                         </div>
                         <div>
                           <h4 className="font-medium text-white flex items-center gap-2">
                             {member.user?.display_name || member.user?.email}
                             {member.role === 'team_leader' && (
                               <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Líder</span>
                             )}
                           </h4>
                           <p className="text-sm text-white/50">{member.job_title || 'Sin cargo'}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4 text-white/40">
                         <div className="text-right hidden sm:block">
                           <p className="text-xs">Ubicación</p>
                           <p className="text-sm text-white/70">
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
        {activeTab === 'courses' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Plan de Aprendizaje del Equipo</h2>
                <p className="text-white/50">Cursos específicos asignados a este equipo.</p>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg cursor-pointer hover:bg-blue-600/90 transition-all flex items-center gap-2 bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Asignar Cursos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <CourseCard 
                    key={course.id}
                    title={course.title}
                    category={course.category}
                    students={course.enrolled_count}
                    progress={course.avg_progress}
                    image={course.thumbnail_url}
                  />
                ))
              ) : (
                 assignedCourses.length === 0 && (
                   <div className="col-span-full py-12 text-center text-white/40 border border-white/5 rounded-2xl bg-white/5">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No hay cursos con actividad en este equipo.</p>
                   </div>
                 )
              )}
               {assignedCourses.map((course, idx) => (
                <CourseCard 
                  key={`optimistic-${idx}`}
                  title={course.title || "Curso Asignado (Pendiente)"}
                  category="Asignado Recientemente"
                  students={0}
                  progress={0}
                />
              ))}
              <button
                onClick={() => setIsCourseModalOpen(true)} 
                className="rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-white/40" />
                </div>
                <h3 className="font-medium text-white">Asignar Nuevo Curso</h3>
              </button>
            </div>
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

      <CourseSelectorModal 
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSelect={handleAssignCourses}
        title={`Asignar a Equipo ${team.name}`}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTeam}
        title="Eliminar Equipo"
        message="¿Estás seguro de que deseas eliminar este equipo? Sus miembros quedarán sin asignar."
        itemName={team.name}
        isLoading={isLoading}
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
          ? 'border-blue-500 text-white' 
          : 'border-transparent text-white/50 hover:text-white hover:border-white/20'}
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
  }
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <p className="text-white/40 text-xs uppercase tracking-wider">{label}</p>
        <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${colors[color].split(' ')[0]}`} />
    </div>
  )
}

function CourseCard({ title, category, students, progress, image }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1E2329] overflow-hidden group hover:border-white/20 transition-all flex flex-col h-full">
      <div className="h-40 bg-neutral-800 relative overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 to-slate-900">
             <BookOpen className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-medium text-white border border-white/10">
          En curso
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-blue-400 font-medium mb-1">{category}</div>
        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{title}</h3>
        
        <div className="mt-auto pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{students} inscritos</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/50">
              <span>Progreso promedio</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
