'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  BarChart3,
  Sparkles,
  UserPlus,
  Crown,
  Activity,
  ChevronRight,
  MoreHorizontal,
  Eye
} from 'lucide-react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { BusinessUser } from '@/features/business-panel/services/businessUsers.service'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'

const AddUserModal = dynamic(() => import('@/features/business-panel/components/BusinessAddUserModal').then(mod => ({ default: mod.BusinessAddUserModal })), { ssr: false })
const EditUserModal = dynamic(() => import('@/features/business-panel/components/BusinessEditUserModal').then(mod => ({ default: mod.BusinessEditUserModal })), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/features/business-panel/components/BusinessDeleteUserModal').then(mod => ({ default: mod.BusinessDeleteUserModal })), { ssr: false })
const ImportUsersModal = dynamic(() => import('@/features/business-panel/components/BusinessImportUsersModal').then(mod => ({ default: mod.BusinessImportUsersModal })), { ssr: false })
const UserStatsModal = dynamic(() => import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({ default: mod.BusinessUserStatsModal })), { ssr: false })

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay: number
  delay: number
  trend?: number
  isDark?: boolean
}

function StatCard({ title, value, icon, gradient, delay, trend = 0, isDark }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 14
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      className="relative group overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
    >
      {/* Animated Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: gradient,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* Glassmorphism Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-500" />

      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: gradient }}
      />

      {/* Soft Glow */}
      <motion.div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700"
        style={{ background: gradient }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container */}
          <motion.div
            className="p-3 rounded-xl backdrop-blur-md border border-white/10"
            style={{ background: `${gradient.split(',')[0].replace('linear-gradient(135deg, ', '')}20` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>

          {/* Trend Badge */}
          {trend !== 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
            >
              <ArrowTrendingUpIcon className="h-3 w-3" />
              +{trend}%
            </motion.div>
          )}
        </div>

        <motion.h3
          className="text-3xl font-black tracking-tight mb-1"
          style={{
            color: isDark ? '#FFFFFF' : '#0F172A',
            textShadow: isDark ? '0 0 20px rgba(0,212,179,0.2)' : 'none'
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>

        <motion.p
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: isDark ? '#E5E7EB' : '#64748B', letterSpacing: '0.05em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 0.9 : 0.7 }}
          transition={{ delay: delay * 0.1 + 0.3 }}
        >
          {title}
        </motion.p>

        {/* Animated Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ delay: delay * 0.1 + 0.5, duration: 0.8 }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: UserCard Premium
// ============================================
interface UserCardProps {
  user: BusinessUser
  index: number
  primaryColor: string
  onEdit: () => void
  onDelete: () => void
  onStats: () => void
  onResend?: () => void
  onSuspend?: () => void
  onActivate?: () => void
}

function UserCard({ user, index, primaryColor, onEdit, onDelete, onStats, onResend, onSuspend, onActivate }: UserCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [showActions, setShowActions] = useState(false)
  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner': return { label: t('users.roles.owner'), color: '#A855F7', bg: 'rgba(168,85,247,0.15)' }
      case 'admin': return { label: t('users.roles.admin'), color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' }
      default: return { label: t('users.roles.member'), color: '#10B981', bg: 'rgba(16,185,129,0.15)' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: t('users.status.active'), color: '#10B981', icon: CheckCircle }
      case 'invited': return { label: t('users.status.invited'), color: '#F59E0B', icon: Mail }
      case 'suspended': return { label: t('users.status.suspended'), color: '#EF4444', icon: XCircle }
      default: return { label: t('users.status.removed'), color: '#6B7280', icon: AlertCircle }
    }
  }

  const roleConfig = getRoleConfig(user.org_role || 'member')
  const statusConfig = getStatusConfig(user.org_status || 'active')
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { duration: 0.25 }
      }}
      className="relative group overflow-hidden rounded-2xl"
      style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, transparent, ${primaryColor})`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300" />

      {/* Glow Effect */}
      <motion.div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Content */}
      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {user.profile_picture_url ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10">
                  <Image
                    src={user.profile_picture_url}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border-2 border-white/10"
                  style={{ 
                    backgroundColor: `${primaryColor}30`, 
                    color: isDark ? '#FFFFFF' : primaryColor 
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {user.org_role === 'owner' && (
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-purple-500">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{displayName}</h3>
              <p className="text-sm opacity-50 truncate">{user.email}</p>
            </div>
          </div>

          {/* Actions Menu */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <button
                  onClick={onStats}
                  className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 transition-colors"
                  title="Ver estadísticas"
                >
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.7 }} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}
          >
            {roleConfig.label}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/5">
          <div className="text-xs opacity-50 flex-1 min-w-0">
            {user.last_login_at ? (
              <span>{t('users.card.lastAccess')}: {new Date(user.last_login_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
            ) : (
              <span>{t('users.card.noAccess')}</span>
            )}
          </div>

          {/* Quick Actions Based on Status */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
            {user.org_status === 'invited' && onResend && (
              <button
                onClick={onResend}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
              >
                Reenviar
              </button>
            )}
            {user.org_status === 'active' && onSuspend && (
              <button
                onClick={onSuspend}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
              >
                {t('users.card.suspend')}
              </button>
            )}
            {user.org_status === 'suspended' && onActivate && (
              <button
                onClick={onActivate}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              >
                {t('users.card.activate')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Progress Line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.6 }}
      />
    </motion.div>
  )
}

// ============================================
// COMPONENTE: Empty State Premium
// ============================================
function EmptyState({ onAddClick, primaryColor, secondaryColor }: { onAddClick: () => void, primaryColor: string, secondaryColor: string }) {
  const { t } = useTranslation('business')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-12 text-center"
      style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Particles */}
      <motion.div
        className="absolute top-10 left-20 w-3 h-3 rounded-full"
        style={{ backgroundColor: primaryColor }}
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-32 w-2 h-2 rounded-full"
        style={{ backgroundColor: secondaryColor }}
        animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <UserPlus className="w-12 h-12" style={{ color: primaryColor, opacity: 0.6 }} />
        </motion.div>

        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
          {t('users.empty.title')}
        </h3>

        <p className="text-sm opacity-60 mb-6 max-w-md mx-auto leading-relaxed">
          {t('users.empty.subtitle')}
        </p>

        <motion.button
          onClick={onAddClick}
          className="px-6 py-3 rounded-xl font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 8px 30px ${primaryColor}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {t('users.empty.cta')}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============================================
// PÁGINA PRINCIPAL: Users Management
// ============================================
export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users, stats, isLoading, error, refetch, createUser, updateUser, deleteUser, resendInvitation, suspendUser, activateUser } = useBusinessUsers()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<BusinessUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [statsUser, setStatsUser] = useState<BusinessUser | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)


  // Theme Colors
  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const secondaryColor = panelStyles?.secondary_button_color || '#1E2329' // Usando fondo secundario oscuro como secundario default
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.org_role === filterRole
    const matchesStatus = filterStatus === 'all' || user.org_status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  // Theme Logic
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const handleSaveNewUser = async (userData: any) => { await createUser(userData); refetch() }

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-800/50 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 group"
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            opacity: isDark ? 0.3 : 1
          }}
        />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Animated Particles */}
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 right-20 w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 right-40 w-3 h-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                </motion.div>
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
                  {t('sidebar.teams')} {/* Using teams here as subtitle or management? Original was 'Gestión de Equipo' */}
                </span>
              </div>

                <motion.h1
                  className="text-3xl lg:text-4xl font-bold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: '#FFFFFF' }}
                >
                  {t('users.title')}
                </motion.h1>

                <motion.p
                  className="text-lg max-w-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {t('users.subtitle')}
                </motion.p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={async () => {
                  const response = await fetch('/api/business/users/template', { credentials: 'include' })
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'plantilla-importacion-usuarios.csv'
                    a.click()
                  }
                }}

                className="px-4 py-2.5 rounded-xl font-medium text-sm border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                {t('users.buttons.template')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-4 h-4" />
                {t('users.buttons.import')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm !text-white transition-all flex items-center gap-2"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  boxShadow: `0 8px 30px ${primaryColor}40`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 !text-white" color="#FFFFFF" strokeWidth={3} />
                <span className="!text-white font-bold" style={{ color: '#FFFFFF' }}>
                  {t('users.buttons.add')}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-400">{t('users.error.loadFailed')}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('users.stats.total')}
          value={stats.total}
          icon={<Users className="w-6 h-6" style={{ color: '#3B82F6' }} />}
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          delay={0}
          trend={12}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.active')}
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6" style={{ color: '#10B981' }} />}
          gradient="linear-gradient(135deg, #10B981, #059669)"
          delay={1}
          trend={8}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.invited')}
          value={stats.invited}
          icon={<Mail className="w-6 h-6" style={{ color: '#F59E0B' }} />}
          gradient="linear-gradient(135deg, #F59E0B, #D97706)"
          delay={2}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.admins')}
          value={stats.admins}
          icon={<Shield className="w-6 h-6" style={{ color: '#A855F7' }} />}
          gradient="linear-gradient(135deg, #A855F7, #7C3AED)"
          delay={3}
          trend={5}
          isDark={isDark}
        />
      </div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search Input */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-40 group-focus-within:opacity-70 transition-opacity" />
          <input
            type="text"
            placeholder={t('users.placeholders.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          />
        </div>

        {/* Role Filter - Custom Dropdown */}
        <div className="relative min-w-[160px]">
          <button
            type="button"
            onClick={() => {
              setIsRoleDropdownOpen(!isRoleDropdownOpen)
              setIsStatusDropdownOpen(false)
            }}
            className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: filterRole !== 'all' ? primaryColor : 'rgba(255,255,255,0.1)',
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            <span className="text-sm">
              {filterRole === 'all' ? t('users.roles.all') :
                filterRole === 'owner' ? t('users.roles.owner') :
                  filterRole === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
            </span>
            <motion.svg
              animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }}
              className="w-4 h-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {isRoleDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                style={{
                  backgroundColor: 'var(--org-card-background, #1E2329)',
                  borderColor: 'rgba(255,255,255,0.15)'
                }}
              >
                {[
                  { value: 'all', label: t('users.roles.all') },
                  { value: 'owner', label: t('users.roles.owner') },
                  { value: 'admin', label: t('users.roles.admin') },
                  { value: 'member', label: t('users.roles.member') }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilterRole(option.value)
                      setIsRoleDropdownOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-current/5"
                    style={{
                      backgroundColor: filterRole === option.value ? `${primaryColor}20` : 'transparent',
                      color: filterRole === option.value 
                        ? (isDark ? '#FFFFFF' : primaryColor)
                        : (isDark ? 'rgba(255,255,255,0.7)' : '#374151')
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Filter - Custom Dropdown */}
        <div className="relative min-w-[160px]">
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(!isStatusDropdownOpen)
              setIsRoleDropdownOpen(false)
            }}
            className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: filterStatus !== 'all' ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            <span className="text-sm">
              {filterStatus === 'all' ? t('users.status.all') :
                filterStatus === 'active' ? t('users.status.active') :
                  filterStatus === 'invited' ? t('users.status.invited') : t('users.status.suspended')}
            </span>
            <motion.svg
              animate={{ rotate: isStatusDropdownOpen ? 180 : 0 }}
              className="w-4 h-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {isStatusDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                style={{
                  backgroundColor: 'var(--org-card-background, #1E2329)',
                  borderColor: 'rgba(255,255,255,0.15)'
                }}
              >
                {[
                  { value: 'all', label: t('users.status.all') },
                  { value: 'active', label: t('users.status.active') },
                  { value: 'invited', label: t('users.status.invited') },
                  { value: 'suspended', label: t('users.status.suspended') }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilterStatus(option.value)
                      setIsStatusDropdownOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-current/5"
                    style={{
                      backgroundColor: filterStatus === option.value ? `${accentColor}20` : 'transparent',
                      color: filterStatus === option.value 
                        ? (isDark ? '#FFFFFF' : accentColor)
                        : (isDark ? 'rgba(255,255,255,0.7)' : '#374151')
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Users Grid or Empty State */}
      <AnimatePresence mode="wait">
        {filteredUsers.length === 0 ? (
          <EmptyState
            key="empty"
            onAddClick={() => setIsAddModalOpen(true)}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"
          >
            {filteredUsers.map((user, index) => (
              <UserCard
                key={user.id}
                user={user}
                index={index}
                primaryColor={primaryColor}
                onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewUser} />
      <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null) }} onSave={async (id, data) => { await updateUser(id, data) }} />
      <DeleteUserModal user={deletingUser} isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingUser(null) }} onConfirm={async () => { if (deletingUser) await deleteUser(deletingUser.id) }} />
      <ImportUsersModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportComplete={() => { refetch(); setIsImportModalOpen(false) }} />
      {statsUser && <UserStatsModal user={statsUser} isOpen={isStatsModalOpen} onClose={() => { setIsStatsModalOpen(false); setStatsUser(null) }} />}
    </div>
  )
}
