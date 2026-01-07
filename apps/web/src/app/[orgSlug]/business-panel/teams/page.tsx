'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  UsersRound,
  Search,
  Plus,
  User,
  BookOpen,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Users,
  Activity,
  Target,
  ChevronRight
} from 'lucide-react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { useTeams } from '@/features/business-panel/hooks/useTeams'
import { Button } from '@aprende-y-aplica/ui'
import { useRouter, useParams } from 'next/navigation'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { BusinessTeamModal } from '@/features/business-panel/components/BusinessTeamModal'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'

// ============================================
// COMPONENTE: StatCard Premium para Teams
// ============================================
interface TeamStatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay: number
  trend?: number
  cardBg: string
  textColor: string
}

function TeamStatCard({ title, value, icon, gradient, delay, trend = 0, cardBg, textColor }: TeamStatCardProps) {
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
      className="relative group overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: cardBg }}
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
            color: textColor,
            textShadow: '0 0 20px rgba(0,212,179,0.2)'
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>

        <motion.p
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: textColor, opacity: 0.6, letterSpacing: '0.05em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
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
// COMPONENTE: TeamCard Premium
// ============================================
interface TeamCardProps {
  team: any
  index: number
  primaryColor: string
  cardBg: string
  cardBorder: string
  textColor: string
  onClick: () => void
}

function TeamCard({ team, index, primaryColor, cardBg, cardBorder, textColor, onClick }: TeamCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const [imageError, setImageError] = useState(false)
  const imageUrl = team.image_url || team.metadata?.image_url || null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.25 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: cardBg }}
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
      <div
        className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300"
      />

      {/* Glow Effect */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Team Image/Icon */}
            <motion.div
              className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={team.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <UsersRound className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-0.5 truncate" style={{ color: textColor }}>
                {team.name}
              </h3>
              {team.team_leader && (
                <p className="text-xs opacity-60 flex items-center gap-1 truncate">
                  <User className="w-3 h-3" />
                  {team.team_leader.name}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <motion.span
            className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border"
            style={
              team.status === 'active'
                ? {
                    backgroundColor: resolvedTheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    borderColor: resolvedTheme === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.4)'
                  }
                : team.status === 'inactive'
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      borderColor: 'rgba(245, 158, 11, 0.3)'
                    }
                  : {
                      backgroundColor: 'rgba(107, 114, 128, 0.15)',
                      color: '#6B7280',
                      borderColor: 'rgba(107, 114, 128, 0.3)'
                    }
            }
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.08 + 0.2, type: 'spring' }}
          >
            {team.status === 'active' ? t('teams.status.active') : team.status === 'inactive' ? t('teams.status.inactive') : t('teams.status.archived')}
          </motion.span>
        </div>

        {/* Description */}
        {team.description && (
          <p className="text-sm opacity-60 mb-4 line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-white/5">
              <Users className="w-4 h-4 opacity-60" />
            </div>
            <span className="font-semibold">{team.member_count || 0}</span>
            <span className="opacity-50 text-xs">{t('teams.card.members')}</span>
          </div>

          {team.course && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-white/5">
                <BookOpen className="w-4 h-4 opacity-60" />
              </div>
              <span className="font-semibold truncate max-w-[80px]">{team.course.title}</span>
            </div>
          )}

          {/* Arrow */}
          <motion.div
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: primaryColor }} />
          </motion.div>
        </div>
      </div>

      {/* Bottom Progress Line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
      />
    </motion.div>
  )
}

// ============================================
// COMPONENTE: Empty State Premium
// ============================================
function EmptyState({
  searchTerm,
  filterStatus,
  onCreateClick,
  primaryColor,
  secondaryColor
}: {
  searchTerm: string
  filterStatus: string
  onCreateClick: () => void
  primaryColor: string
  secondaryColor: string
}) {
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
          <UsersRound className="w-12 h-12" style={{ color: primaryColor, opacity: 0.6 }} />
        </motion.div>

        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
          {t('teams.empty.title')}
        </h3>

        <p className="text-sm opacity-60 mb-6 max-w-md mx-auto leading-relaxed">
          {searchTerm || filterStatus !== 'all'
            ? t('teams.empty.noResults')
            : t('teams.empty.noTeams')}
        </p>

        {!searchTerm && filterStatus === 'all' && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onCreateClick}
              variant="gradient"
              size="lg"
              className="font-semibold !text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 8px 30px ${primaryColor}40`,
                color: '#FFFFFF'
              }}
            >
              <Plus className="w-5 h-5 mr-2" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>{t('teams.empty.createFirst')}</span>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================
// PÁGINA PRINCIPAL: Teams
// ============================================
export default function BusinessPanelTeamsPage() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { teams, isLoading, error, refetch } = useTeams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()
  const params = useParams()

  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Theme Colors
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : 'rgba(0,0,0,0.1)'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  // Filter Teams
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = searchTerm === '' ||
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.team_leader?.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || team.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [teams, searchTerm, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const totalTeams = teams.length
    const activeTeams = teams.filter(t => t.status === 'active').length
    const totalMembers = teams.reduce((sum, t) => sum + (t.member_count || 0), 0)
    const activeMembers = teams.reduce((sum, t) => sum + (t.active_member_count || 0), 0)

    return { totalTeams, activeTeams, totalMembers, activeMembers }
  }, [teams])

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    refetch()
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse" style={{ color: textColor }}>
        <div className="h-48 rounded-3xl bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="p-6" style={{ color: textColor }}>
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 font-semibold">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8" style={{ color: textColor }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 group"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 mix-blend-multiply opacity-80 z-10"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}99, transparent)`
            }}
          />
          <Image
            src="/images/teams-header.png"
            alt="Teams Background"
            fill
            priority
            className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                </motion.div>
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: '#FFFFFF' }}>
                  {t('teams.badge')}
                </span>
              </div>

              <motion.h1
                className="text-3xl lg:text-4xl font-bold mb-2"
                style={{ color: '#FFFFFF' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('teams.title')}
              </motion.h1>

              <motion.p
                className="text-lg max-w-xl"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t('teams.subtitle')}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="gradient"
                size="lg"
                className="font-semibold shadow-2xl !text-white"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  boxShadow: `0 8px 30px ${primaryColor}40`
                }}
              >
                <div className="flex items-center" style={{ color: '#FFFFFF' }}>
                  <Plus className="w-5 h-5 mr-2" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>{t('teams.buttons.create')}</span>
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TeamStatCard
          title={t('teams.stats.total')}
          value={stats.totalTeams}
          icon={<UsersRound className="w-6 h-6" style={{ color: '#818cf8' }} />}
          gradient="linear-gradient(135deg, #818cf8, #6366f1)"
          delay={0}
          trend={12}
          cardBg={cardBg}
          textColor={textColor}
        />
        <TeamStatCard
          title={t('teams.stats.active')}
          value={stats.activeTeams}
          icon={<Activity className="w-6 h-6" style={{ color: '#34d399' }} />}
          gradient="linear-gradient(135deg, #34d399, #10b981)"
          delay={1}
          trend={8}
          cardBg={cardBg}
          textColor={textColor}
        />
        <TeamStatCard
          title={t('teams.stats.totalMembers')}
          value={stats.totalMembers}
          icon={<Users className="w-6 h-6" style={{ color: '#38bdf8' }} />}
          gradient="linear-gradient(135deg, #38bdf8, #0ea5e9)"
          delay={2}
          trend={15}
          cardBg={cardBg}
          textColor={textColor}
        />
        <TeamStatCard
          title={t('teams.stats.activeMembers')}
          value={stats.activeMembers}
          icon={<Target className="w-6 h-6" style={{ color: '#fbbf24' }} />}
          gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
          delay={3}
          trend={5}
          cardBg={cardBg}
          textColor={textColor}
        />
      </div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search Input */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-40 group-focus-within:opacity-70 transition-opacity" />
          <input
            type="text"
            placeholder={t('teams.filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-300"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textColor
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `0 0 0 2px ${primaryColor}`,
              opacity: 0
            }}
            whileFocus={{ opacity: 1 }}
          />
        </div>

        {/* Filter Select */}
        <div className="relative z-20">
          <PremiumSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: t('teams.filters.all') },
              { value: 'active', label: t('teams.filters.active') },
              { value: 'inactive', label: t('teams.filters.inactive') },
              { value: 'archived', label: t('teams.filters.archived') }
            ]}
            placeholder={t('teams.filters.all')}
            className="w-48"
          />
        </div>
      </motion.div>

      {/* Teams Grid or Empty State */}
      <AnimatePresence mode="wait">
        {filteredTeams.length === 0 ? (
          <EmptyState
            key="empty"
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            onCreateClick={() => setIsCreateModalOpen(true)}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filteredTeams.map((team, index) => (
              <TeamCard
                key={team.team_id}
                team={team}
                index={index}
                primaryColor={primaryColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                onClick={() => router.push(`/${params.orgSlug}/business-panel/teams/${team.team_id}`)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <BusinessTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
