'use client'

import React, { useState, useEffect } from 'react'
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
  FileText, 
  ExternalLink,
  Upload,
  Check,
  Calendar,
  Globe,
  Github,
  Linkedin,
  Award,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Link2,
  Briefcase,
  Camera,
  Trophy,
  Sparkles,
  AtSign,
  FileUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useProfile, UpdateProfileRequest } from '../../features/profile/hooks/useProfile'
import { useRouter } from 'next/navigation'
import { useUserSkills } from '../../features/skills/hooks/useUserSkills'
import { ChangePasswordSchema, type ChangePasswordInput } from '../../lib/schemas/user.schema'
import { ProfileService } from '../../features/profile/services/profile.service'

// ============================================
// DESIGN SYSTEM COLORS
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

// ============================================
// TAB NAVIGATION
// ============================================
type TabId = 'personal' | 'security' | 'links' | 'skills'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'personal', label: 'Información Personal', icon: <User className="w-4 h-4" /> },
  { id: 'security', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'links', label: 'Links y Documentos', icon: <Link2 className="w-4 h-4" /> },
  { id: 'skills', label: 'Mis Skills', icon: <Award className="w-4 h-4" /> },
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
}

function PremiumInput({ label, value, onChange, icon, type = 'text', placeholder }: PremiumInputProps) {
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
          ${focused 
            ? 'shadow-[0_0_30px_rgba(0,212,179,0.15)]' 
            : 'shadow-none hover:shadow-[0_0_20px_rgba(0,212,179,0.05)]'
          }
        `}
      >
        {/* Background */}
        <div 
          className={`
            absolute inset-0 transition-all duration-300
            ${focused 
              ? 'bg-gradient-to-br from-[#1E2329] to-[#161b22]' 
              : 'bg-[#1E2329]/80'
            }
          `}
        />
        
        {/* Border */}
        <div 
          className={`
            absolute inset-0 rounded-2xl border-2 transition-all duration-300
            ${focused 
              ? 'border-[#00D4B3]/50' 
              : 'border-white/[0.06] group-hover:border-white/[0.1]'
            }
          `}
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
}

function PremiumTextarea({ label, value, onChange, maxLength = 500, rows = 4 }: PremiumTextareaProps) {
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
        className={`
          relative rounded-2xl overflow-hidden transition-all duration-300
          ${focused ? 'shadow-[0_0_30px_rgba(0,212,179,0.15)]' : 'shadow-none'}
        `}
      >
        <div className={`absolute inset-0 ${focused ? 'bg-gradient-to-br from-[#1E2329] to-[#161b22]' : 'bg-[#1E2329]/80'}`} />
        <div className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-300 ${focused ? 'border-[#00D4B3]/50' : 'border-white/[0.06]'}`} />
        
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
}

function PremiumPassword({ label, value, onChange, show, onToggle, error }: PremiumPasswordProps) {
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
      
      <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${focused ? 'shadow-[0_0_30px_rgba(0,212,179,0.15)]' : ''}`}>
        <div className={`absolute inset-0 ${focused ? 'bg-gradient-to-br from-[#1E2329] to-[#161b22]' : 'bg-[#1E2329]/80'}`} />
        <div className={`absolute inset-0 rounded-2xl border-2 transition-colors ${error ? 'border-red-500/50' : focused ? 'border-[#00D4B3]/50' : 'border-white/[0.06]'}`} />
        
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
// LINK CARD COMPONENT (for LinkedIn, GitHub, etc.)
// ============================================
interface LinkCardProps {
  title: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function LinkCard({ title, icon, iconBg, iconColor, value, onChange, placeholder }: LinkCardProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <div 
        className={`
          relative rounded-3xl overflow-hidden
          transition-all duration-500
          ${focused 
            ? 'shadow-[0_10px_50px_rgba(0,0,0,0.3)]' 
            : 'shadow-lg shadow-black/20'
          }
        `}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E2329] via-[#1a1f24] to-[#161b22]" />
        
        {/* Animated accent border */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${iconColor}30, transparent 60%)`,
          }}
          animate={{ opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Border */}
        <div className={`absolute inset-0 rounded-3xl border-2 transition-colors duration-300 ${focused ? `border-[${iconColor}]/40` : 'border-white/[0.05] group-hover:border-white/[0.1]'}`} />
        
        <div className="relative p-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4 mb-5">
            <motion.div 
              className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              style={{ color: iconColor }}
            >
              {icon}
            </motion.div>
            <div>
              <h4 className="text-white font-semibold text-lg">{title}</h4>
              <p className="text-white/40 text-sm">
                {hasValue ? 'Conectado' : 'No configurado'}
              </p>
            </div>
            {hasValue && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </motion.div>
            )}
          </div>
          
          {/* Input */}
          <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${focused ? 'ring-2 ring-white/10' : ''}`}>
            <div className="absolute inset-0 bg-black/30" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              className="relative w-full px-4 py-4 bg-transparent text-white text-sm font-medium focus:outline-none placeholder-white/20"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// CV UPLOAD CARD
// ============================================
interface CVUploadCardProps {
  hasCV: boolean
  cvUrl?: string
  onUpload: (file: File) => Promise<string>
}

function CVUploadCard({ hasCV, cvUrl, onUpload }: CVUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full"
    >
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E2329] to-[#161b22] border-2 border-white/[0.05]">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Icon */}
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D4B3]/20 to-[#00D4B3]/5 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 3 }}
            >
              <FileText className="w-10 h-10 text-[#00D4B3]" />
            </motion.div>
            
            {/* Info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Curriculum Vitae</h3>
              <p className="text-white/40 text-sm mb-4">Sube tu CV en formato PDF, DOC o DOCX (máx. 5MB)</p>
              
              <div className="flex flex-wrap items-center gap-4">
                <input 
                  type="file" 
                  id="cv-premium-upload" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleUpload(e.target.files[0])
                  }}
                />
                
                <motion.label 
                  htmlFor="cv-premium-upload"
                  className={`
                    inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold cursor-pointer
                    transition-all duration-300
                    ${isDragging 
                      ? 'bg-[#00D4B3] text-black' 
                      : 'bg-[#00D4B3]/10 text-[#00D4B3] hover:bg-[#00D4B3]/20 border border-[#00D4B3]/30'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0])
                  }}
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileUp className="w-5 h-5" />
                  )}
                  <span>{hasCV ? 'Cambiar CV' : 'Subir CV'}</span>
                </motion.label>
                
                {hasCV && cvUrl && (
                  <motion.a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">Ver documento</span>
                  </motion.a>
                )}
              </div>
            </div>
            
            {/* Status */}
            {hasCV && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">CV Cargado</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN PROFILE PAGE
// ============================================
export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    profile, 
    stats,
    loading, 
    saving, 
    updateProfile, 
    uploadProfilePicture, 
    uploadCurriculum
  } = useProfile()
  
  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const { skills: userSkills, isLoading: skillsLoading, refreshSkills } = useUserSkills(user?.id || null)
  
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${colors.accent}30` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border-2 border-t-[#00D4B3] border-r-transparent border-b-transparent border-l-transparent"
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
        <p className="text-white/50">Error al cargar el perfil</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
      {/* FIXED TOP BAR */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${colors.bgPrimary}e6`, borderColor: 'rgba(255,255,255,0.05)' }}
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
              color: saving ? 'rgba(255,255,255,0.5)' : showSaveSuccess ? 'white' : colors.primary,
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
                  { icon: <Trophy className="w-5 h-5" />, value: profile.points.toLocaleString(), label: 'Puntos', color: '#F59E0B' },
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
                  <PremiumInput label="Nombre" value={formData.first_name || ''} onChange={(v) => handleInputChange('first_name', v)} icon={<User className="w-4 h-4" />} />
                  <PremiumInput label="Apellido" value={formData.last_name || ''} onChange={(v) => handleInputChange('last_name', v)} icon={<User className="w-4 h-4" />} />
                  <PremiumInput label="Nombre de Usuario" value={formData.username || ''} onChange={(v) => handleInputChange('username', v)} icon={<AtSign className="w-4 h-4" />} />
                  <PremiumInput label="Rol en la Empresa" value={formData.type_rol || ''} onChange={(v) => handleInputChange('type_rol', v)} icon={<Briefcase className="w-4 h-4" />} />
                  <PremiumInput label="Teléfono" value={formData.phone || ''} onChange={(v) => handleInputChange('phone', v)} icon={<Phone className="w-4 h-4" />} type="tel" />
                  <PremiumInput label="Ubicación" value={formData.location || ''} onChange={(v) => handleInputChange('location', v)} icon={<MapPin className="w-4 h-4" />} />
                </div>
                <PremiumTextarea label="Biografía" value={formData.bio || ''} onChange={(v) => handleInputChange('bio', v)} maxLength={500} rows={4} />
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
                  />
                  <PremiumPassword 
                    label="Nueva Contraseña" 
                    value={newPassword} 
                    onChange={(v) => setPasswordValue('new_password', v)} 
                    show={showNewPassword} 
                    onToggle={() => setShowNewPassword(!showNewPassword)} 
                    error={passwordErrors.new_password?.message} 
                  />
                  <PremiumPassword 
                    label="Confirmar Contraseña" 
                    value={confirmPassword} 
                    onChange={(v) => setPasswordValue('confirm_password', v)} 
                    show={showConfirmPassword} 
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
                    error={passwordErrors.confirm_password?.message} 
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

            {/* LINKS TAB */}
            {activeTab === 'links' && (
              <motion.div key="links" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <CVUploadCard 
                  hasCV={!!profile.curriculum_url}
                  cvUrl={profile.curriculum_url}
                  onUpload={uploadCurriculum}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LinkCard
                    title="Portafolio"
                    icon={<Globe className="w-7 h-7" />}
                    iconBg="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5"
                    iconColor="#06B6D4"
                    value={formData.website_url || ''}
                    onChange={(v) => handleInputChange('website_url', v)}
                    placeholder="https://tu-sitio.com"
                  />
                  <LinkCard
                    title="LinkedIn"
                    icon={<Linkedin className="w-7 h-7" />}
                    iconBg="bg-gradient-to-br from-[#0A66C2]/20 to-[#0A66C2]/5"
                    iconColor="#0A66C2"
                    value={formData.linkedin_url || ''}
                    onChange={(v) => handleInputChange('linkedin_url', v)}
                    placeholder="https://linkedin.com/in/..."
                  />
                  <LinkCard
                    title="GitHub"
                    icon={<Github className="w-7 h-7" />}
                    iconBg="bg-gradient-to-br from-white/20 to-white/5"
                    iconColor="#FFFFFF"
                    value={formData.github_url || ''}
                    onChange={(v) => handleInputChange('github_url', v)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </motion.div>
            )}

            {/* SKILLS TAB */}
            {activeTab === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {skillsLoading ? (
                  <div className="py-20 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `3px solid ${colors.accent}20` }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `3px solid transparent`, borderTopColor: colors.accent }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8" style={{ color: colors.accent }} />
                      </div>
                    </div>
                    <p className="text-white/50 text-lg">Cargando tus habilidades...</p>
                  </div>
                ) : userSkills.length > 0 ? (
                  <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { 
                          label: 'Total Skills', 
                          value: userSkills.length, 
                          icon: <Award className="w-6 h-6" />,
                          color: colors.accent,
                          gradient: `linear-gradient(135deg, ${colors.accent}20, ${colors.accent}05)`
                        },
                        { 
                          label: 'Nivel Más Alto', 
                          value: (() => {
                            const levelOrder: Record<string, number> = { diamond: 5, gold: 4, silver: 3, bronze: 2, green: 1 }
                            const levels = userSkills.map(s => s.level).filter(Boolean)
                            const highest = levels.reduce((h, l) => (levelOrder[l || ''] || 0) > (levelOrder[h || ''] || 0) ? l : h, levels[0])
                            const levelNames: Record<string, string> = { diamond: 'Diamante', gold: 'Oro', silver: 'Plata', bronze: 'Bronce', green: 'Verde' }
                            return levelNames[highest || ''] || 'N/A'
                          })(),
                          icon: <Trophy className="w-6 h-6" />,
                          color: '#F59E0B',
                          gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))'
                        },
                        { 
                          label: 'Categorías', 
                          value: new Set(userSkills.map(s => s.skill.category)).size,
                          icon: <Sparkles className="w-6 h-6" />,
                          color: '#8B5CF6',
                          gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))'
                        },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative overflow-hidden rounded-2xl border"
                          style={{ background: stat.gradient, borderColor: 'rgba(255,255,255,0.05)' }}
                        >
                          <div className="p-5 flex items-center justify-between">
                            <div>
                              <p className="text-white/40 text-sm mb-1">{stat.label}</p>
                              <p className="text-3xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: `${stat.color}20` }}
                            >
                              <div style={{ color: stat.color }}>{stat.icon}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {['all', ...Array.from(new Set(userSkills.map(s => s.skill.category)))].map((cat, i) => {
                        const categoryLabels: Record<string, string> = {
                          all: 'Todas',
                          leadership: 'Liderazgo',
                          programming: 'Programación',
                          design: 'Diseño',
                          marketing: 'Marketing',
                          business: 'Negocios',
                          data: 'Datos',
                          ai: 'IA',
                          communication: 'Comunicación',
                          other: 'Otros'
                        }
                        return (
                          <motion.button
                            key={cat}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                            style={{
                              backgroundColor: i === 0 ? colors.accent : 'rgba(255,255,255,0.05)',
                              color: i === 0 ? colors.primary : 'rgba(255,255,255,0.6)',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {categoryLabels[cat] || cat}
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Skills Grid - Premium Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {userSkills.map((skill, index) => {
                        const levelColors: Record<string, { bg: string, border: string, text: string, glow: string }> = {
                          diamond: { bg: '#E0F2FE', border: '#38BDF8', text: '#0369A1', glow: 'rgba(56,189,248,0.4)' },
                          gold: { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309', glow: 'rgba(245,158,11,0.4)' },
                          silver: { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563', glow: 'rgba(156,163,175,0.4)' },
                          bronze: { bg: '#FED7AA', border: '#EA580C', text: '#9A3412', glow: 'rgba(234,88,12,0.4)' },
                          green: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', glow: 'rgba(16,185,129,0.4)' },
                        }
                        const levelNames: Record<string, string> = { diamond: 'Diamante', gold: 'Oro', silver: 'Plata', bronze: 'Bronce', green: 'Verde' }
                        const level = skill.level || 'green'
                        const levelStyle = levelColors[level] || levelColors.green

                        return (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
                            whileHover={{ 
                              y: -8, 
                              scale: 1.02,
                              boxShadow: `0 20px 40px ${levelStyle.glow}`
                            }}
                            className="group relative"
                          >
                            {/* Card */}
                            <div 
                              className="relative overflow-hidden rounded-3xl border-2 transition-all duration-500"
                              style={{ 
                                backgroundColor: colors.bgSecondary,
                                borderColor: 'rgba(255,255,255,0.05)',
                              }}
                            >
                              {/* Gradient overlay on hover */}
                              <div 
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(135deg, ${levelStyle.border}10, transparent)` }}
                              />
                              
                              {/* Top accent bar */}
                              <div 
                                className="h-1.5 w-full"
                                style={{ background: `linear-gradient(90deg, ${levelStyle.border}, ${levelStyle.border}60)` }}
                              />
                              
                              <div className="p-5">
                                {/* Badge/Icon */}
                                <div className="flex items-start justify-between mb-4">
                                  <motion.div 
                                    className="relative w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                                    style={{ backgroundColor: `${levelStyle.border}15` }}
                                    whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
                                  >
                                    {skill.badge_url || skill.skill.icon_url ? (
                                      <img 
                                        src={skill.badge_url || skill.skill.icon_url || ''} 
                                        alt={skill.skill.name}
                                        className="w-12 h-12 object-contain"
                                      />
                                    ) : (
                                      <span 
                                        className="text-2xl font-bold"
                                        style={{ color: levelStyle.border }}
                                      >
                                        {skill.skill.name.substring(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                    
                                    {/* Glow effect */}
                                    <div 
                                      className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl"
                                      style={{ backgroundColor: levelStyle.border }}
                                    />
                                  </motion.div>
                                  
                                  {/* Level Badge */}
                                  <motion.div
                                    className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                                    style={{ 
                                      backgroundColor: levelStyle.bg,
                                      color: levelStyle.text,
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: levelStyle.border }}
                                    />
                                    {levelNames[level]}
                                  </motion.div>
                                </div>
                                
                                {/* Skill Info */}
                                <h4 className="text-white font-bold text-lg mb-1 group-hover:text-white transition-colors line-clamp-1">
                                  {skill.skill.name}
                                </h4>
                                <p className="text-white/40 text-sm mb-4 line-clamp-2">
                                  {skill.skill.description || 'Habilidad obtenida al completar cursos relacionados'}
                                </p>
                                
                                {/* Stats */}
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-white/30 text-sm">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{skill.course_count} curso{skill.course_count !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div 
                                    className="flex items-center gap-1.5 text-sm"
                                    style={{ color: `${levelStyle.border}90` }}
                                  >
                                    <Award className="w-4 h-4" />
                                    <span>Nivel {levelNames[level]}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  /* Empty State - Premium Design */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative overflow-hidden rounded-3xl border"
                    style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div 
                        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10"
                        style={{ backgroundColor: colors.warning }}
                      />
                    </div>
                    
                    <div className="relative py-20 px-8 text-center">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                        className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${colors.accent}20, ${colors.warning}10)`,
                          border: `2px solid ${colors.accent}30`
                        }}
                      >
                        <Award className="w-14 h-14" style={{ color: colors.accent }} />
                      </motion.div>
                      
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white mb-3"
                      >
                        Aún no tienes skills
                      </motion.h3>
                      
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/40 text-lg max-w-md mx-auto mb-8"
                      >
                        Completa cursos para desbloquear habilidades y construir tu perfil profesional
                      </motion.p>
                      
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                        whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${colors.accent}40` }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard')}
                      >
                        <BookOpen className="w-5 h-5" />
                        Explorar Cursos
                      </motion.button>
                    </div>
                  </motion.div>
                )}
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
