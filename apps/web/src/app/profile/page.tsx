'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  Calendar,
  BookOpen,
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Briefcase,
  Camera,
  AtSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useProfile, UpdateProfileRequest } from '../../features/profile/hooks/useProfile'
import { useRouter } from 'next/navigation'
import { ChangePasswordSchema, type ChangePasswordInput } from '../../lib/schemas/user.schema'
import { ProfileService } from '../../features/profile/services/profile.service'
import { useOrganizationStyles } from '../../features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '../../features/business-panel/utils/styles'

// ============================================
// DESIGN SYSTEM COLORS
// ============================================
// ============================================
// DESIGN SYSTEM COLORS
// ============================================
const DEFAULT_COLORS = {
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

type ColorPalette = typeof DEFAULT_COLORS

// ============================================
// TAB NAVIGATION
// ============================================
type TabId = 'personal' | 'security'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'personal', label: 'Información Personal', icon: <User className="w-4 h-4" /> },
  { id: 'security', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
]

// ============================================
// PREMIUM INPUT FIELD
// ============================================
interface PremiumInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: React.ReactNode
  type?: string
  placeholder?: string
  colors?: ColorPalette
}

function PremiumInput({ label, value, onChange, icon, type = 'text', placeholder, colors = DEFAULT_COLORS }: PremiumInputProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated border gradient on focus */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)`,
        }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      {/* Main container */}
      <div
        className={`
          relative rounded-2xl overflow-hidden
          transition-all duration-300 ease-out
        `}
        style={{
          boxShadow: focused
            ? `0 0 30px ${colors.accent}26` // 0.15 alpha approx
            : 'none'
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` // 0.8 alpha
          }}
        />

        {/* Border */}
        <div
          className="absolute inset-0 rounded-2xl border-2 transition-all duration-300"
          style={{
            borderColor: focused
              ? `${colors.accent}80` // 0.5 alpha
              : 'rgba(255, 255, 255, 0.06)'
          }}
        />

        {/* Content */}
        <div className="relative flex items-center">
          {/* Icon */}
          {icon && (
            <motion.div
              className="pl-5 flex-shrink-0"
              animate={{
                color: focused ? colors.accent : 'rgba(255,255,255,0.3)',
                scale: focused ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}

          {/* Input wrapper */}
          <div className="relative flex-1 py-5 px-4">
            {/* Floating label */}
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              initial={false}
              animate={{
                top: (focused || hasValue) ? '8px' : '50%',
                y: (focused || hasValue) ? 0 : '-50%',
                fontSize: (focused || hasValue) ? '11px' : '14px',
                color: focused ? colors.accent : 'rgba(255,255,255,0.4)',
                letterSpacing: (focused || hasValue) ? '0.5px' : '0',
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>

            {/* Input */}
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? placeholder : ''}
              className={`
                w-full bg-transparent text-white text-base font-medium
                focus:outline-none placeholder-white/20
                ${(focused || hasValue) ? 'pt-4' : 'pt-0'}
              `}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// PREMIUM TEXTAREA
// ============================================
interface PremiumTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  colors?: ColorPalette
}

function PremiumTextarea({ label, value, onChange, maxLength = 500, rows = 4, colors = DEFAULT_COLORS }: PremiumTextareaProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value && value.length > 0
  const charCount = value?.length || 0
  const isNearLimit = charCount > maxLength * 0.8

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated border gradient */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)`,
        }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none'
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }}
        />
        <div
          className="absolute inset-0 rounded-2xl border-2 transition-colors duration-300"
          style={{ borderColor: focused ? `${colors.accent}80` : 'rgba(255, 255, 255, 0.06)' }}
        />

        <div className="relative p-5">
          {/* Label */}
          <motion.label
            className="block mb-3 font-medium text-xs tracking-wide"
            animate={{ color: focused ? colors.accent : 'rgba(255,255,255,0.4)' }}
          >
            {label}
          </motion.label>

          {/* Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={rows}
            maxLength={maxLength}
            className="w-full bg-transparent text-white text-base font-medium resize-none focus:outline-none placeholder-white/20 leading-relaxed"
            placeholder="Cuéntanos sobre ti, tus intereses y objetivos..."
          />

          {/* Character counter */}
          <div className="flex justify-end mt-2">
            <span className={`text-xs font-medium transition-colors ${isNearLimit ? 'text-amber-400' : 'text-white/20'}`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// PREMIUM PASSWORD FIELD
// ============================================
interface PremiumPasswordProps {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  colors?: ColorPalette
}

function PremiumPassword({ label, value, onChange, show, onToggle, error, colors = DEFAULT_COLORS }: PremiumPasswordProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Border glow on focus */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0"
        style={{
          background: error
            ? `linear-gradient(135deg, ${colors.error}40, transparent)`
            : `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)`,
        }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none'
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }}
        />
        <div
          className="absolute inset-0 rounded-2xl border-2 transition-colors"
          style={{
            borderColor: error
              ? `${colors.error}80`
              : focused
                ? `${colors.accent}80`
                : 'rgba(255, 255, 255, 0.06)'
          }}
        />

        <div className="relative flex items-center">
          <motion.div
            className="pl-5"
            animate={{ color: focused ? colors.accent : 'rgba(255,255,255,0.3)' }}
          >
            <Lock className="w-4 h-4" />
          </motion.div>

          <div className="relative flex-1 py-5 px-4">
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              animate={{
                top: (focused || hasValue) ? '8px' : '50%',
                y: (focused || hasValue) ? 0 : '-50%',
                fontSize: (focused || hasValue) ? '11px' : '14px',
                color: focused ? colors.accent : 'rgba(255,255,255,0.4)',
              }}
            >
              {label}
            </motion.label>

            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? '••••••••' : ''}
              className={`w-full bg-transparent text-white text-base font-medium focus:outline-none ${(focused || hasValue) ? 'pt-4' : ''}`}
            />
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="pr-5 text-white/30 hover:text-white/60 transition-colors"
          >
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-400 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </motion.div>
  )
}



// ============================================
// MAIN PROFILE PAGE
// ============================================
export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { styles: orgStyles } = useOrganizationStyles()

  // Calcular colores dinámicos
  const colors = useMemo(() => {
    if (!orgStyles?.userDashboard) return DEFAULT_COLORS

    const dashboardStyles = orgStyles.userDashboard
    const panelStyles = orgStyles.panel

    // Determinar fondo
    let bgPrimary = dashboardStyles.background_value || DEFAULT_COLORS.bgPrimary
    // Si es imagen o gradiente complejo, usamos fallback sólido oscuro para legibilidad si necesario,
    // o permitimos que se use si es un CSS válido para background-color.
    // Para simplificar y asegurar contraste, si no es hex, usamos default.
    // Si es imagen o gradiente, lo permitimos tal cual.
    // Solo si está vacío ponemos el default.
    if (!bgPrimary) {
      bgPrimary = DEFAULT_COLORS.bgPrimary
    }

    const primaryButtonColor = dashboardStyles.primary_button_color || DEFAULT_COLORS.primary
    const accentColor = dashboardStyles.accent_color || DEFAULT_COLORS.accent
    const sidebarBg = panelStyles?.sidebar_background || DEFAULT_COLORS.bgSecondary

    return {
      ...DEFAULT_COLORS,
      primary: primaryButtonColor,
      accent: accentColor,
      bgPrimary: bgPrimary,
      bgSecondary: (sidebarBg && sidebarBg.startsWith('#')) ? sidebarBg : DEFAULT_COLORS.bgSecondary,
    }
  }, [orgStyles])

  const {
    profile,
    stats,
    loading,
    saving,
    updateProfile,
    uploadProfilePicture
  } = useProfile()

  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch: watchPassword,
    trigger: triggerPassword,
    setValue: setPasswordValue
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onChange',
    defaultValues: { current_password: '', new_password: '', confirm_password: '' }
  })

  const currentPassword = watchPassword('current_password')
  const newPassword = watchPassword('new_password')
  const confirmPassword = watchPassword('confirm_password')

  useEffect(() => {
    if (newPassword && currentPassword && newPassword.length > 0 && currentPassword.length > 0) {
      const timeoutId = setTimeout(() => { triggerPassword('new_password') }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [newPassword, currentPassword, triggerPassword])

  useEffect(() => {
    if (profile) setFormData(profile)
  }, [profile])

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.id || !currentPassword || !newPassword) {
      setPasswordChangeError('Completa todos los campos')
      return
    }

    setIsChangingPassword(true)
    setPasswordChangeError(null)
    setPasswordChangeSuccess(null)

    try {
      await ProfileService.changePassword(user.id, currentPassword, newPassword)
      setPasswordChangeSuccess('¡Contraseña actualizada!')
      resetPasswordForm()
      setTimeout(() => setPasswordChangeSuccess(null), 5000)
    } catch (error) {
      setPasswordChangeError(error instanceof Error ? error.message : 'Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bgPrimary }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${colors.accent}30` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border-2 border-r-transparent border-b-transparent border-l-transparent"
              style={{ borderTopColor: colors.accent }}
              animate={{ rotate: -360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-white/50">Cargando perfil...</p>
        </motion.div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: colors.bgPrimary }}>
        <p className="text-white/50">Error al cargar el perfil</p>
        <p className="text-white/30 text-sm max-w-md text-center">
          Esto puede deberse a que tu sesión ha expirado. Intenta iniciar sesión nuevamente.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-lg text-black font-medium transition-colors"
            style={{ backgroundColor: colors.accent }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bgPrimary }}>
      {/* FIXED TOP BAR */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b"
        style={{
          background: colors.bgPrimary.startsWith('#') || colors.bgPrimary.startsWith('rgb')
            ? colors.bgPrimary
            : 'rgba(15, 20, 25, 0.9)', // Fallback oscuro si es imagen/gradiente
          borderColor: 'rgba(255,255,255,0.05)'
        }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          <motion.button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </motion.button>

          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-300"
            style={{
              backgroundColor: saving ? 'rgba(255,255,255,0.1)' : showSaveSuccess ? colors.success : colors.accent,
              color: saving ? 'rgba(255,255,255,0.5)' : 'white', // Texto blanco siempre para contraste
            }}
            whileHover={!saving ? { scale: 1.02 } : undefined}
            whileTap={!saving ? { scale: 0.98 } : undefined}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : showSaveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Guardando...' : showSaveSuccess ? 'Guardado' : 'Guardar cambios'}</span>
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="pt-16 min-h-screen">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${colors.accent}10 0%, transparent 100%)` }} />
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: `${colors.accent}20` }} />
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: '#8B5CF620' }} />

          <div className="relative px-6 lg:px-12 py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Avatar */}
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl p-1" style={{ background: `linear-gradient(135deg, ${colors.accent}30, #8B5CF630)` }}>
                  <div className="w-full h-full rounded-[22px] overflow-hidden flex items-center justify-center" style={{ backgroundColor: colors.bgSecondary }}>
                    {profile.profile_picture_url ? (
                      <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-white/20" />
                    )}
                  </div>
                </div>

                <input type="file" id="avatar-upload" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      try { await uploadProfilePicture(e.target.files[0]) }
                      catch (error) { console.error(error) }
                    }
                  }}
                />
                <motion.label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: colors.accent, boxShadow: `0 10px 30px ${colors.accent}40` }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera className="w-5 h-5" style={{ color: colors.primary }} />
                </motion.label>
              </motion.div>

              {/* User Info */}
              <div className="flex-1">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{profile.display_name}</h1>
                  <p className="text-lg text-white/50 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {profile.type_rol || 'Sin rol definido'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Miembro desde {formatDate(profile.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: colors.success }}>
                      <Check className="w-3.5 h-3.5" />
                      Email verificado
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Stats */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-3 lg:gap-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, value: stats?.completedLessons ?? 0, label: 'Lecciones', color: '#3B82F6' },
                  { icon: <GraduationCap className="w-5 h-5" />, value: stats?.certificates ?? 0, label: 'Certificados', color: '#8B5CF6' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="rounded-2xl p-4 lg:p-5 text-center min-w-[100px]"
                    style={{ backgroundColor: `${stat.color}15` }}
                    whileHover={{ scale: 1.05, y: -3 }}
                  >
                    <div className="mb-2 flex justify-center" style={{ color: stat.color }}>{stat.icon}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/40">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div
          className="sticky top-16 z-40 backdrop-blur-xl border-b"
          style={{ backgroundColor: `${colors.bgPrimary}f0`, borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="px-6 lg:px-12">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar py-3">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                    color: activeTab === tab.id ? colors.primary : 'rgba(255,255,255,0.5)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="px-6 lg:px-12 py-10">
          <AnimatePresence mode="wait">
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PremiumInput label="Nombre" value={formData.first_name || ''} onChange={(v) => handleInputChange('first_name', v)} icon={<User className="w-4 h-4" />} colors={colors} />
                  <PremiumInput label="Apellido" value={formData.last_name || ''} onChange={(v) => handleInputChange('last_name', v)} icon={<User className="w-4 h-4" />} colors={colors} />
                  <PremiumInput label="Nombre de Usuario" value={formData.username || ''} onChange={(v) => handleInputChange('username', v)} icon={<AtSign className="w-4 h-4" />} colors={colors} />
                  <PremiumInput label="Rol en la Empresa" value={formData.type_rol || ''} onChange={(v) => handleInputChange('type_rol', v)} icon={<Briefcase className="w-4 h-4" />} colors={colors} />
                  <PremiumInput label="Teléfono" value={formData.phone || ''} onChange={(v) => handleInputChange('phone', v)} icon={<Phone className="w-4 h-4" />} type="tel" colors={colors} />
                  <PremiumInput label="Ubicación" value={formData.location || ''} onChange={(v) => handleInputChange('location', v)} icon={<MapPin className="w-4 h-4" />} colors={colors} />
                </div>
                <PremiumTextarea label="Biografía" value={formData.bio || ''} onChange={(v) => handleInputChange('bio', v)} maxLength={500} rows={4} colors={colors} />
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Success/Error Messages */}
                <AnimatePresence>
                  {passwordChangeSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="p-4 rounded-2xl flex items-center gap-3"
                      style={{
                        backgroundColor: `${colors.success}15`,
                        border: `1px solid ${colors.success}30`
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${colors.success}20` }}
                      >
                        <CheckCircle2 className="w-5 h-5" style={{ color: colors.success }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: colors.success }}>¡Contraseña actualizada!</p>
                        <p className="text-sm text-white/50">{passwordChangeSuccess}</p>
                      </div>
                    </motion.div>
                  )}
                  {passwordChangeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="p-4 rounded-2xl flex items-center gap-3"
                      style={{
                        backgroundColor: `${colors.error}15`,
                        border: `1px solid ${colors.error}30`
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${colors.error}20` }}
                      >
                        <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: colors.error }}>Error</p>
                        <p className="text-sm text-white/50">{passwordChangeError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Input - Same style as Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PremiumInput
                    label="Correo Electrónico"
                    value={formData.email || ''}
                    onChange={(v) => handleInputChange('email', v)}
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    colors={colors}
                  />
                </div>

                {/* Password Section Title */}
                <div className="pt-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accent}15` }}
                  >
                    <Shield className="w-6 h-6" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Cambiar Contraseña</h3>
                    <p className="text-white/40 text-sm">Actualiza tu contraseña de acceso</p>
                  </div>
                </div>

                {/* Password Inputs - Same grid as Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PremiumPassword
                    label="Contraseña Actual"
                    value={currentPassword}
                    onChange={(v) => setPasswordValue('current_password', v)}
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    error={passwordErrors.current_password?.message}
                    colors={colors}
                  />
                  <PremiumPassword
                    label="Nueva Contraseña"
                    value={newPassword}
                    onChange={(v) => setPasswordValue('new_password', v)}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                    error={passwordErrors.new_password?.message}
                    colors={colors}
                  />
                  <PremiumPassword
                    label="Confirmar Contraseña"
                    value={confirmPassword}
                    onChange={(v) => setPasswordValue('confirm_password', v)}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    error={passwordErrors.confirm_password?.message}
                    colors={colors}
                  />
                </div>

                {/* Change Password Button */}
                <div className="flex justify-end pt-2">
                  <motion.button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300"
                    style={{
                      backgroundColor: (isChangingPassword || !currentPassword || !newPassword || !confirmPassword)
                        ? 'rgba(255,255,255,0.05)'
                        : colors.accent,
                      color: (isChangingPassword || !currentPassword || !newPassword || !confirmPassword)
                        ? 'rgba(255,255,255,0.3)'
                        : colors.primary,
                      boxShadow: (isChangingPassword || !currentPassword || !newPassword || !confirmPassword)
                        ? 'none'
                        : `0 10px 30px ${colors.accent}30`,
                    }}
                    whileHover={(isChangingPassword || !currentPassword || !newPassword || !confirmPassword)
                      ? undefined
                      : { scale: 1.02, boxShadow: `0 15px 40px ${colors.accent}40` }}
                    whileTap={(isChangingPassword || !currentPassword || !newPassword || !confirmPassword)
                      ? undefined
                      : { scale: 0.98 }}
                  >
                    {isChangingPassword ? (
                      <div className="w-5 h-5 border-2 rounded-full animate-spin"
                        style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }}
                      />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </motion.button>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
