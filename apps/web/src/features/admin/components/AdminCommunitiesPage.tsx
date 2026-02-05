'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  MessageCircle,
  Calendar,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Clock,
  BookOpen,
  Sparkles,
  TrendingUp,
  Globe,
  Lock,
  UserCheck,
  LayoutGrid,
  List,
  ChevronRight,
  Activity,
  Crown,
  Zap
} from 'lucide-react'
import { useAdminCommunities } from '../hooks/useAdminCommunities'
import { AdminCommunity } from '../services/adminCommunities.service'
import { useRouter } from 'next/navigation'

// ============================================
// SOFLIA DESIGN SYSTEM COLORS
// ============================================
const colors = {
  primary: '#0A2540',
  accent: '#00D4B3',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bgPrimary: '#0F1419',
  bgSecondary: '#1E2329',
  bgTertiary: '#0A0D12',
  grayLight: '#E9ECEF',
  grayMedium: '#6C757D',
}

// Lazy loading de modales
const EditCommunityModal = dynamic(() => import('./EditCommunityModal').then(mod => ({ default: mod.EditCommunityModal })), {
  ssr: false
})

const DeleteCommunityModal = dynamic(() => import('./DeleteCommunityModal').then(mod => ({ default: mod.DeleteCommunityModal })), {
  ssr: false
})

const AddCommunityModal = dynamic(() => import('./AddCommunityModal').then(mod => ({ default: mod.AddCommunityModal })), {
  ssr: false
})

// ============================================
// ANIMATED STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay: number
  trend?: number
}

function StatCard({ title, value, icon, gradient, delay, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="relative group overflow-hidden rounded-2xl p-6 cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)` }}
    >
      {/* Animated gradient overlay */}
      <motion.div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
      />
      
      {/* Glow effect */}
      <motion.div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
        style={{ background: colors.accent }}
      />

      {/* Decorative circles */}
      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: colors.accent, transform: 'translate(30%, 30%)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 rounded-xl border border-white/10"
            style={{ background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.primary}40 100%)` }}
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          >
            {icon}
          </motion.div>
          
          {trend !== undefined && (
            <motion.div 
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                trend >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
            >
              <TrendingUp className={`h-3.5 w-3.5 ${trend < 0 ? 'rotate-180' : ''}`} />
              {trend >= 0 ? '+' : ''}{trend}%
            </motion.div>
          )}
        </div>
        
        <motion.h3 
          className="text-4xl font-bold text-white mb-2 tracking-tight"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>
        
        <p className="text-sm font-medium" style={{ color: colors.grayMedium }}>{title}</p>
        
        {/* Animated line */}
        <motion.div 
          className="absolute bottom-0 left-0 h-1 rounded-full"
          style={{ background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}
          initial={{ width: 0 }}
          animate={{ width: '40%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )
}

// ============================================
// COMMUNITY CARD COMPONENT
// ============================================
interface CommunityCardProps {
  community: AdminCommunity
  index: number
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}

function CommunityCard({ community, index, onView, onEdit, onDelete, onToggleVisibility }: CommunityCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getTypeInfo = () => {
    if (community.visibility === 'private') {
      return { label: 'Privada', icon: Lock, color: colors.warning, bg: `${colors.warning}20` }
    }
    if (community.access_type === 'moderated') {
      return { label: 'Moderada', icon: UserCheck, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' }
    }
    return { label: 'PÃºblica', icon: Globe, color: colors.success, bg: `${colors.success}20` }
  }
  
  const typeInfo = getTypeInfo()
  const TypeIcon = typeInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        duration: 0.5,
        type: "spring",
        stiffness: 80
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-3xl overflow-hidden"
      style={{ 
        background: `linear-gradient(145deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
        border: `1px solid ${isHovered ? colors.accent + '50' : 'rgba(255,255,255,0.05)'}`
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle at 50% 0%, ${colors.accent}15 0%, transparent 60%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Community Image / Gradient Header */}
      <div className="relative h-44 overflow-hidden">
        {community.image_url ? (
          <>
            <motion.img
              src={community.image_url}
              alt={community.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.5 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent}30 100%)`
            }}
          >
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 2, ease: "linear" }}
            >
              <Users className="w-16 h-16 text-white/30" />
            </motion.div>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: typeInfo.bg, border: `1px solid ${typeInfo.color}40` }}
          >
            <TypeIcon className="w-3.5 h-3.5" style={{ color: typeInfo.color }} />
            <span className="text-xs font-semibold" style={{ color: typeInfo.color }}>
              {typeInfo.label}
            </span>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md ${
              community.is_active 
                ? 'bg-emerald-500/20 border border-emerald-500/40' 
                : 'bg-gray-500/20 border border-gray-500/40'
            }`}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${community.is_active ? 'bg-emerald-400' : 'bg-gray-400'}`}
            />
            <span className={`text-xs font-semibold ${community.is_active ? 'text-emerald-400' : 'text-gray-400'}`}>
              {community.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </motion.div>
        </div>

        {/* Floating action buttons on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onView() }}
                className="p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                title="Ver detalles"
              >
                <Eye className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
                className="p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                title={community.is_active ? 'Desactivar' : 'Activar'}
              >
                {community.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="p-2.5 rounded-xl backdrop-blur-md border border-white/20 text-white transition-colors"
                style={{ background: `${colors.accent}30` }}
                title="Editar"
              >
                <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-2.5 rounded-xl backdrop-blur-md bg-red-500/30 border border-red-500/40 text-red-400 hover:bg-red-500/40 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Course */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#00D4B3] transition-colors">
            {community.name}
          </h3>
          
          {community.course && (
            <motion.div 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ 
                background: `${colors.primary}80`,
                border: `1px solid ${colors.accent}30`
              }}
            >
              <BookOpen className="w-3 h-3" style={{ color: colors.accent }} />
              <span className="text-white/80 font-medium truncate max-w-[180px]">
                {community.course.title}
              </span>
            </motion.div>
          )}
        </div>

        <p className="text-sm text-gray-400 line-clamp-2 mb-5 min-h-[40px]">
          {community.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div 
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: `${colors.bgTertiary}80` }}
          >
            <div 
              className="p-2 rounded-lg"
              style={{ background: `${colors.accent}20` }}
            >
              <Users className="w-4 h-4" style={{ color: colors.accent }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{community.member_count}</p>
              <p className="text-xs text-gray-500">Miembros</p>
            </div>
          </div>
          
          <div 
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: `${colors.bgTertiary}80` }}
          >
            <div 
              className="p-2 rounded-lg"
              style={{ background: `${colors.success}20` }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: colors.success }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{community.posts_count || 0}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                color: 'white'
              }}
            >
              {(community.creator_name || 'A')[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-400 truncate max-w-[120px]">
              {community.creator_name || 'Sin creador'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{community.created_at ? new Date(community.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Click area for view */}
      <div 
        className="absolute inset-0 cursor-pointer z-0"
        onClick={onView}
      />
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function AdminCommunitiesPage() {
  const router = useRouter()
  const { communities, stats, isLoading, error, refetch } = useAdminCommunities()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modal states
  const [editingCommunity, setEditingCommunity] = useState<AdminCommunity | null>(null)
  const [deletingCommunity, setDeletingCommunity] = useState<AdminCommunity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Handlers
  const handleEditCommunity = (community: AdminCommunity) => {
    setEditingCommunity(community)
    setIsEditModalOpen(true)
  }

  const handleDeleteCommunity = (community: AdminCommunity) => {
    setDeletingCommunity(community)
    setIsDeleteModalOpen(true)
  }

  const handleViewCommunity = (community: AdminCommunity) => {
    router.push(`/admin/communities/${community.slug}`)
  }

  const handleToggleVisibility = async (community: AdminCommunity) => {
    try {
      const response = await fetch(`/api/admin/communities/${community.id}/toggle-visibility`, {
        method: 'PATCH'
      })
      if (response.ok) refetch()
    } catch (error) {
      console.error('Error toggling visibility:', error)
    }
  }

  const handleSaveCommunity = async (communityData: any) => {
    const response = await fetch(`/api/admin/communities/${editingCommunity?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(communityData)
    })
    if (response.ok) refetch()
    else throw new Error('Error al actualizar comunidad')
  }

  const handleConfirmDelete = async () => {
    if (!deletingCommunity) return
    const response = await fetch(`/api/admin/communities/${deletingCommunity.id}`, {
      method: 'DELETE'
    })
    if (response.ok) refetch()
    else throw new Error('Error al eliminar comunidad')
  }

  const handleSaveNewCommunity = async (communityData: any) => {
    const response = await fetch('/api/admin/communities/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(communityData)
    })
    const data = await response.json()
    if (response.ok && data.success) refetch()
    else throw new Error(data.message || data.error || 'Error al crear la comunidad')
  }

  // Filtered communities
  const filteredCommunities = useMemo(() => {
    return communities.filter(community => {
      const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (community.creator_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const communityCategory = community.visibility === 'private' ? 'Privada' : 
                               community.access_type === 'moderated' ? 'Moderada' : 'PÃºblica'
      const matchesCategory = filterCategory === 'all' || communityCategory === filterCategory
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && community.is_active) ||
                           (filterStatus === 'inactive' && !community.is_active)
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [communities, searchTerm, filterCategory, filterStatus])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: colors.bgPrimary }}>
        <div className="max-w-7xl mx-auto">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-8">
            <div className="h-32 rounded-3xl" style={{ background: colors.bgSecondary }} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl" style={{ background: colors.bgSecondary }} />
              ))}
            </div>
            <div className="h-16 rounded-2xl" style={{ background: colors.bgSecondary }} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-3xl" style={{ background: colors.bgSecondary }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center" style={{ background: colors.bgPrimary }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-3xl max-w-md"
          style={{ background: colors.bgSecondary }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${colors.error}20` }}>
            <Zap className="w-8 h-8" style={{ color: colors.error }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error al cargar</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refetch}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}
          >
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: colors.bgPrimary }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-8"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgSecondary} 100%)`,
            border: `1px solid ${colors.accent}20`
          }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
              style={{ background: colors.accent }}
            />
            <motion.div 
              animate={{ 
                x: [0, -50, 0],
                y: [0, 50, 0],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl"
              style={{ background: colors.accent }}
            />
          </div>

          {/* Animated particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 3 + i, 
                repeat: Infinity,
                delay: i * 0.5
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{ 
                background: colors.accent,
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`
              }}
            />
          ))}

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: colors.accent }} />
                </motion.div>
                <span 
                  className="text-sm font-medium tracking-widest uppercase"
                  style={{ color: colors.accent }}
                >
                  Panel de GestiÃ³n
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Comunidades
              </h1>
              <p className="text-lg text-white/60 max-w-xl">
                Administra, modera y haz crecer las comunidades de tu plataforma de aprendizaje.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${colors.accent}40` }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-white shadow-lg self-start"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                boxShadow: `0 10px 40px ${colors.accent}30`
              }}
            >
              <Plus className="w-5 h-5" />
              <span>Crear Comunidad</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Comunidades"
            value={stats?.totalCommunities || 0}
            icon={<Users className="w-6 h-6" style={{ color: colors.accent }} />}
            gradient="bg-gradient-to-br from-[#00D4B3]/20 to-transparent"
            delay={0}
            trend={12}
          />
          <StatCard
            title="Total Miembros"
            value={stats?.totalMembers || 0}
            icon={<Crown className="w-6 h-6" style={{ color: colors.warning }} />}
            gradient="bg-gradient-to-br from-[#F59E0B]/20 to-transparent"
            delay={1}
            trend={8}
          />
          <StatCard
            title="Total Posts"
            value={stats?.totalPosts || 0}
            icon={<MessageCircle className="w-6 h-6" style={{ color: colors.success }} />}
            gradient="bg-gradient-to-br from-[#10B981]/20 to-transparent"
            delay={2}
            trend={24}
          />
          <StatCard
            title="Comunidades Activas"
            value={stats?.activeCommunities || 0}
            icon={<Activity className="w-6 h-6" style={{ color: '#8B5CF6' }} />}
            gradient="bg-gradient-to-br from-[#8B5CF6]/20 to-transparent"
            delay={3}
          />
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col lg:flex-row gap-4 p-5 rounded-2xl"
          style={{ background: colors.bgSecondary }}
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar comunidades por nombre, descripciÃ³n o creador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4B3] focus:ring-1 focus:ring-[#00D4B3] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="w-4 h-4" />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white focus:outline-none focus:border-[#00D4B3] transition-all cursor-pointer"
            >
              <option value="all">Todas las categorÃ­as</option>
              <option value="PÃºblica">PÃºblicas</option>
              <option value="Privada">Privadas</option>
              <option value="Moderada">Moderadas</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white focus:outline-none focus:border-[#00D4B3] transition-all cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1.5 rounded-xl" style={{ background: colors.bgTertiary }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[#00D4B3] text-white' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-[#00D4B3] text-white' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="text-white font-medium">{filteredCommunities.length}</span> de{' '}
            <span className="text-white font-medium">{communities.length}</span> comunidades
          </p>
        </div>

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: `${colors.accent}10` }}
            >
              <Users className="w-12 h-12" style={{ color: colors.accent }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron comunidades</h3>
            <p className="text-gray-400 mb-6">Intenta ajustar los filtros o crear una nueva comunidad</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}
            >
              Crear Comunidad
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredCommunities.map((community, index) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  index={index}
                  onView={() => handleViewCommunity(community)}
                  onEdit={() => handleEditCommunity(community)}
                  onDelete={() => handleDeleteCommunity(community)}
                  onToggleVisibility={() => handleToggleVisibility(community)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <EditCommunityModal
        community={editingCommunity}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingCommunity(null) }}
        onSave={handleSaveCommunity}
      />

      <DeleteCommunityModal
        community={deletingCommunity}
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingCommunity(null) }}
        onConfirm={handleConfirmDelete}
      />

      <AddCommunityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewCommunity}
      />
    </div>
  )
}
