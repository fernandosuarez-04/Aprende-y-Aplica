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
  Plus
} from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { HierarchyService } from '@/features/business-panel/services/hierarchy.service'
import { uploadZoneLogo } from '@/features/business-panel/services/hierarchyUpload.service'
import { Zone, Team, ManagerInfo, HierarchyAnalytics, HierarchyCourse } from '@/features/business-panel/types/hierarchy.types'
import {
  ZoneForm,
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
      <div className="h-[400px] w-full rounded-2xl bg-[#1E2329] border border-white/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    )
  }
)

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
  const [analytics, setAnalytics] = useState<HierarchyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'courses'>('overview')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [availableManagers, setAvailableManagers] = useState<ManagerInfo[]>([])

  // Courses state
  const [courses, setCourses] = useState<HierarchyCourse[]>([])
  const [assignedCourses, setAssignedCourses] = useState<any[]>([])

  useEffect(() => {
    const loadManagers = async () => {
      const users = await BusinessUsersService.getOrganizationUsers()
      const managers = users
        .filter(u => u.org_status === 'active')
        .map(u => ({
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
      const result = await HierarchyService.updateZone(zone.id, data)
      if (result.success && result.data) {
        setZone(result.data)
        setIsEditOpen(false)
      } else {
        alert('Error al actualizar: ' + result.error)
      }
    } catch (err) {
      alert('Error al actualizar la zona')
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
        alert('Error al eliminar: ' + result.error)
        setIsLoading(false)
      }
    } catch (err) {
      alert('Error al eliminar la zona')
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
      } else {
        alert('Error al crear equipo: ' + result.error)
      }
    } catch (err) {
      alert('Error al crear equipo')
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
    alert(`Se asignaron ${courseIds.length} cursos a la zona (Simulación)`)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [zoneData, teamsData, analyticsData, coursesData] = await Promise.all([
          HierarchyService.getZone(zoneId),
          HierarchyService.getTeams({ zoneId, withCounts: true, withLeader: true }),
          HierarchyService.getVisualAnalytics('zone', zoneId),
          HierarchyService.getEntityCourses('zone', zoneId)
        ])
        setZone(zoneData)
        setTeams(teamsData)
        setAnalytics(analyticsData)
        setCourses(coursesData)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (zoneId) {
      loadData()
    }
  }, [zoneId])

  const mapPoints = teams
    .filter(t => t.latitude && t.longitude)
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
                {(zone as any).logo_url ? (
                  <Image
                    src={(zone as any).logo_url}
                    alt={zone.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
                  >
                    <Building2 className="w-16 h-16 text-white/20" />
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
                    {zone.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/60">
                    {zone.code && (
                      <span className="bg-white/5 px-2 py-1 rounded-md text-sm font-mono border border-white/5">
                        {zone.code}
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        zone.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {zone.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    {(zone.city || zone.country) && (
                      <span className="flex items-center gap-1 text-sm">
                        <Globe className="w-4 h-4 opacity-50" />
                        {[zone.city, zone.state, zone.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                    title="Editar Zona"
                  >
                    <Edit className="w-5 h-5 text-white/60 group-hover:text-white" />
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 transition-colors group"
                    title="Eliminar Zona"
                  >
                    <Trash2 className="w-5 h-5 text-white/60 group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{teams.length}</p>
                    <p className="text-xs text-white/50">Equipos</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics?.users_count || teams.reduce((acc, t) => acc + (t.members_count || 0), 0)}
                    </p>
                    <p className="text-xs text-white/50">Usuarios</p>
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
                Gerente de Zona
              </h3>
              
              {zone.manager ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {zone.manager.profile_picture_url ? (
                      <Image
                        src={zone.manager.profile_picture_url}
                        alt={zone.manager.display_name || ''}
                        fill
                        className="rounded-full object-cover border-4 border-white/5"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white/5">
                        {zone.manager.display_name?.charAt(0)}
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
                <div className="text-center py-10 text-white/30">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Sin gerente asignado</p>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
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
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/60" />
                Métricas de Rendimiento (Tiempo Real)
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
                  trend={`de ${analytics?.users_count || 0}`}
                  trendUp={true}
                  color="purple"
                />
              </div>
              
              {analytics?.top_performer && (
                 <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-400 font-medium">✨ Equipo con mayor impacto</p>
                      <p className="text-xl font-bold text-white">{analytics.top_performer.name}</p>
                      <p className="text-xs text-white/50">{analytics.top_performer.value} horas registradas</p>
                    </div>
                 </div>
              )}

              <div className="h-48 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">Gráfico de actividad semanal</p>
                  <p className="text-xs text-white/20 mt-1">(Datos en tiempo real)</p>
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
                <Network className="w-5 h-5 text-white/40" />
                Equipos y Distribución
              </h2>
              <button
                onClick={() => setIsNewTeamOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                <Plus className="w-4 h-4" />
                Nuevo Equipo
              </button>
            </div>
            
            {/* Map Section */}
            {mapPoints.length > 0 ? (
               <div className="p-1">
                 <HierarchyMap points={mapPoints} />
                 <div className="px-6 py-2 text-xs text-white/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Equipo Estándar
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-4"></span> Equipo Destacado (Top Performer)
                 </div>
               </div>
            ) : (
               <div className="p-6 text-center text-white/40 border-b border-white/10">
                 <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No hay ubicaciones geográficas registradas para los equipos.</p>
                 <p className="text-xs mt-1">Configura la ubicación en cada equipo para verlos en el mapa.</p>
               </div>
            )}
            
            <div className="p-6">
               <h3 className="font-semibold text-white mb-4">Listado de Equipos ({teams.length})</h3>
               {teams.length === 0 ? (
                 <div className="text-center py-10 text-white/40">
                   <p>No hay equipos registrados</p>
                   <button
                    onClick={() => setIsNewTeamOpen(true)}
                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                   >
                     Crear primer equipo
                   </button>
                 </div>
               ) : (
                 <div className="divide-y divide-white/5">
                   {teams.map((team) => (
                     <div key={team.id} className="py-4 hover:bg-white/5 transition-colors px-4 -mx-4 rounded-xl group">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shrink-0 relative">
                             <Network className="w-6 h-6 text-white/40" />
                             {analytics?.top_performer?.id === team.id && (
                               <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#1E2329]" title="Top Performer" />
                             )}
                           </div>
                           <div>
                             <Link href={`/${orgSlug}/business-panel/hierarchy/team/${team.id}`} className="block group-hover:text-blue-400 transition-colors flex items-center gap-2">
                               <h4 className="font-semibold text-lg">{team.name}</h4>
                               {analytics?.top_performer?.id === team.id && (
                                  <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">Top</span>
                               )}
                             </Link>
                             <div className="flex items-center gap-3 text-sm text-white/50">
                               {team.code && <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">{team.code}</span>}
                               <span>•</span>
                               <span>Líder: {team.leader ? team.leader.display_name : 'N/A'}</span>
                               <span>•</span>
                               <span>{team.members_count || 0} miembros</span>
                             </div>
                           </div>
                         </div>
                         
                         <Link 
                           href={`/${orgSlug}/business-panel/hierarchy/team/${team.id}`}
                           className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
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

        {activeTab === 'courses' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Plan de Aprendizaje de Zona</h2>
                <p className="text-white/50">Gestiona los cursos asignados a los equipos de esta zona.</p>
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
                      <p>No hay cursos con actividad en esta zona.</p>
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

      <CourseSelectorModal 
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSelect={handleAssignCourses}
        title={`Asignar a Zona ${zone.name}`}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteZone}
        title="Eliminar Zona"
        message="¿Estás seguro de que deseas eliminar esta zona? Se eliminarán todos los equipos asociados."
        itemName={zone.name}
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
