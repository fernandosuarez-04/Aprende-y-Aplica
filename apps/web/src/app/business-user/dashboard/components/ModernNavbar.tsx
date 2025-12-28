'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  ChevronDown,
  Edit3,
  LogOut,
  Building2,
  Menu,
  X,
  Sparkles,
  User,
  Settings,
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  Globe
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useTranslation } from 'react-i18next'

interface ModernNavbarProps {
  organization: {
    id: string
    name: string
    logo_url?: string | null
    favicon_url?: string | null
  } | null
  user: {
    profile_picture_url?: string | null
    first_name?: string | null
    last_name?: string | null
    display_name?: string | null
    username?: string | null
    email?: string | null
    cargo_rol?: string | null
  } | null
  getDisplayName: () => string
  getInitials: () => string
  onProfileClick: () => void
  onLogout: () => void
  styles?: StyleConfig | null
}

export function ModernNavbar({
  organization,
  user,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout,
  styles
}: ModernNavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('business')

  // Detectar cuando el componente está montado (para portals)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar si el usuario tiene un plan de estudio
  useEffect(() => {
    const checkStudyPlan = async () => {
      try {
        const response = await fetch('/api/study-planner/status', {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setHasStudyPlan(!!data.hasPlan)
        } else {
          setHasStudyPlan(false)
        }
      } catch (error) {
        console.error('Error checking study plan:', error)
        setHasStudyPlan(false)
      }
    }

    // Cargar al abrir cualquier menú (desktop o móvil) o si aún es null
    if ((userDropdownOpen || mobileMenuOpen) && hasStudyPlan === null) {
      checkStudyPlan()
    }
  }, [userDropdownOpen, mobileMenuOpen, hasStudyPlan])

  // Colores SOFIA por defecto con soporte para colores personalizados
  const colors = useMemo(() => {
    const primaryColor = styles?.primary_button_color || '#0A2540'
    const accentColor = styles?.accent_color || '#00D4B3'
    const textColor = styles?.text_color || '#FFFFFF'
    const cardBg = styles?.card_background || '#1E2329'
    const sidebarBg = styles?.sidebar_background || '#0F1419'
    const sidebarOpacity = styles?.sidebar_opacity !== undefined ? styles.sidebar_opacity : 0.95

    let navBgColor: string
    if (sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      navBgColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else {
      navBgColor = sidebarBg
    }

    return {
      primary: primaryColor,
      accent: accentColor,
      text: textColor,
      cardBg,
      navBg: navBgColor,
      border: 'rgba(255, 255, 255, 0.08)',
      borderActive: `${accentColor}40`,
      gradientStart: primaryColor,
      gradientEnd: accentColor
    }
  }, [styles])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Contenido del Menú Móvil
  const mobileMenuContent = (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[100] overflow-y-auto"
          style={{
            backgroundColor: colors.cardBg,
            borderTop: `1px solid ${colors.border}`
          }}
        >
          <div className="px-4 py-4 space-y-2">
            {/* User Info Card */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}10)`,
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                }}
              >
                {user?.profile_picture_url ? (
                  <Image
                    src={user.profile_picture_url}
                    alt={getDisplayName()}
                    width={48}
                    height={48}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {getInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{getDisplayName()}</p>
                <p className="text-xs text-white/60 truncate">{user?.email || ''}</p>
              </div>
            </div>

            {/* Panel Administración */}
            {user?.cargo_rol === 'Business' && (
              <motion.button
                onClick={() => {
                  router.push('/business-panel/dashboard')
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.primary}10`,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-white font-medium block text-sm">{t('header.adminPanel')}</span>
                  <span className="text-xs text-white/50">{t('header.manageOrganization')}</span>
                </div>
              </motion.button>
            )}

            {/* Study Planner */}
            {hasStudyPlan !== null && (
              <motion.button
                onClick={() => {
                  router.push(hasStudyPlan ? '/study-planner/dashboard' : '/study-planner/create')
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.accent}10`,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`
                  }}
                >
                  {hasStudyPlan ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-white font-medium block text-sm">
                    {hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}
                  </span>
                  <span className="text-xs text-white/50">
                    {hasStudyPlan ? t('header.viewSchedule') : t('header.organizeLearning')}
                  </span>
                </div>
              </motion.button>
            )}

             {/* Editar Perfil */}
             <motion.button
              onClick={() => {
                onProfileClick()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <User className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-white font-medium block text-sm">{t('header.editProfile')}</span>
                <span className="text-xs text-white/50">{t('header.updateInfo')}</span>
              </div>
            </motion.button>


            {/* Language Selector */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                 <Globe className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                 <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>{t('header.language')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 {(['es', 'en', 'pt'] as const).map((lang) => (
                   <motion.button
                     key={lang}
                     onClick={() => setLanguage(lang)}
                     className="relative overflow-hidden rounded-xl py-2 text-sm font-medium transition-colors border"
                     style={{
                       backgroundColor: language === lang ? `${colors.accent}15` : 'transparent',
                       borderColor: language === lang ? `${colors.accent}30` : colors.border,
                       color: language === lang ? colors.accent : `${colors.text}60`
                     }}
                     whileTap={{ scale: 0.95 }}
                   >
                     {lang.toUpperCase()}
                   </motion.button>
                 ))}
              </div>
            </div>

            {/* Cerrar Sesión */}
            <motion.button
              onClick={() => {
                onLogout()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <LogOut className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-red-400 font-medium block text-sm">{t('header.logout')}</span>
                <span className="text-xs text-white/50">{t('header.exitAccount')}</span>
              </div>
            </motion.button>
          </div>

          {/* Footer decorativo */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full backdrop-blur-xl"
        style={{
          backgroundColor: colors.navBg,
        }}
      >
        {/* Gradient border bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}30, ${colors.primary}30, transparent)`
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo y Nombre */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                {/* Logo con efecto premium */}
                <div className="relative">
                  {(organization?.favicon_url || organization?.logo_url) ? (
                    <motion.div
                      className="relative h-9 w-auto min-w-[36px] flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Image
                        src={organization.favicon_url || organization.logo_url || '/icono.png'}
                        alt={organization.name}
                        width={36}
                        height={36}
                        className="object-contain h-full w-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icono.png';
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      className="h-11 w-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                        boxShadow: `0 4px 20px ${colors.primary}30`
                      }}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Building2 className="h-6 w-6 text-white" />
                    </motion.div>
                  )}

                  {/* Indicador de activo */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.navBg.includes('rgba') ? '#0F1419' : colors.navBg
                    }}
                  />
                </div>

                {/* Nombre y subtítulo */}
                <div className="hidden sm:block">
                  <h1
                    className="text-lg font-bold leading-tight tracking-tight"
                    style={{ color: colors.text }}
                  >
                    {organization?.name || t('header.myOrganization')}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles
                      className="w-3 h-3"
                      style={{ color: colors.accent }}
                    />
                    <p
                      className="text-xs font-medium"
                      style={{ color: `${colors.accent}CC` }}
                    >
                      {t('header.learningPanel')}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop User Menu */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center justify-center transition-all duration-300 p-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      boxShadow: `0 4px 15px ${colors.primary}40`
                    }}
                  >
                    {user?.profile_picture_url ? (
                      <Image
                        src={user.profile_picture_url}
                        alt={getDisplayName()}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {getInitials()}
                      </span>
                    )}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[998]"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-3 w-80 rounded-2xl border overflow-hidden z-[999]"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px ${colors.primary}15`
                        }}
                      >
                         {/* Header del dropdown */}
                         <div
                          className="p-5 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}10)`
                          }}
                        >
                          <div
                            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30"
                            style={{ backgroundColor: colors.accent }}
                          />
                          <div className="flex items-center gap-4 relative z-10">
                            <div
                              className="h-14 w-14 rounded-2xl flex items-center justify-center relative"
                              style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                                boxShadow: `0 4px 20px ${colors.primary}40`
                              }}
                            >
                              {user?.profile_picture_url ? (
                                <Image
                                  src={user.profile_picture_url}
                                  alt={getDisplayName()}
                                  width={56}
                                  height={56}
                                  className="h-full w-full rounded-2xl object-cover"
                                />
                              ) : (
                                <span className="text-xl font-bold text-white">
                                  {getInitials()}
                                </span>
                              )}
                              <div
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: colors.accent,
                                  boxShadow: `0 2px 8px ${colors.accent}50`
                                }}
                              >
                                <Sparkles className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-white truncate">
                                {getDisplayName()}</p>
                              <p className="text-sm text-white/60 truncate mt-0.5">
                                {user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className="h-px mx-4"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                        />

                        {/* Items del dropdown desktop */}
                        <div className="py-2 px-2">
                          {user?.cargo_rol === 'Business' && (
                            <motion.button
                              onClick={() => {
                                router.push('/business-panel/dashboard')
                                setUserDropdownOpen(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group mb-1"
                              whileHover={{ x: 4 }}
                              style={{ backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.primary}10`
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <div
                                className="p-2.5 rounded-xl text-white"
                                style={{
                                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                                  boxShadow: `0 4px 12px ${colors.primary}40`
                                }}
                              >
                                <LayoutDashboard className="h-4 w-4" />
                              </div>
                              <div className="text-left flex-1">
                                <span className="font-semibold block" style={{ color: colors.text }}>
                                  {t('header.adminPanel')}
                                </span>
                                <span className="text-xs" style={{ color: `${colors.text}80` }}>
                                  {t('header.manageOrganization')}
                                </span>
                              </div>
                              <ChevronDown
                                className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-50 transition-opacity"
                                style={{ color: colors.text }}
                              />
                            </motion.button>
                          )}

                          {hasStudyPlan !== null && (
                            <motion.button
                              onClick={() => {
                                router.push(hasStudyPlan ? '/study-planner/dashboard' : '/study-planner/create')
                                setUserDropdownOpen(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group mb-1"
                              whileHover={{ x: 4 }}
                              style={{ backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.accent}10`
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <div
                                className="p-2.5 rounded-xl text-white"
                                style={{
                                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                                  boxShadow: `0 4px 12px ${colors.accent}40`
                                }}
                              >
                                {hasStudyPlan ? (
                                  <CalendarDays className="h-4 w-4" />
                                ) : (
                                  <CalendarPlus className="h-4 w-4" />
                                )}
                              </div>
                              <div className="text-left flex-1">
                                  <span className="font-semibold block" style={{ color: colors.text }}>
                                    {hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}
                                  </span>
                                <span className="text-xs" style={{ color: `${colors.text}80` }}>
                                  {hasStudyPlan ? t('header.viewSchedule') : t('header.organizeLearning')}
                                </span>
                              </div>
                              <ChevronDown
                                className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-50 transition-opacity"
                                style={{ color: colors.text }}
                              />
                            </motion.button>
                          )}

                          <motion.button
                            onClick={() => {
                              onProfileClick()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group"
                            whileHover={{ x: 4 }}
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${colors.primary}15`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div
                              className="p-2.5 rounded-xl transition-all duration-200"
                              style={{
                                backgroundColor: `${colors.accent}15`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              <User
                                className="h-4 w-4 transition-colors"
                                style={{ color: colors.accent }}
                              />
                            </div>
                            <div className="text-left flex-1">
                              <span className="text-white font-medium block">{t('header.editProfile')}</span>
                              <span className="text-xs text-white/50">{t('header.updateInfo')}</span>
                            </div>
                            <ChevronDown
                              className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-50 transition-opacity"
                              style={{ color: colors.text }}
                            />
                          </motion.button>


                          {/* Language Selector */}
                          <div className="px-4 py-2 mt-1 mb-1">
                             <div className="flex items-center gap-2 mb-2 px-1">
                                <Globe className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                                <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>{t('header.language')}</span>
                             </div>
                             <div className="grid grid-cols-3 gap-1">
                                {(['es', 'en', 'pt'] as const).map((lang) => (
                                  <motion.button
                                    key={lang}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLanguage(lang);
                                    }}
                                    className="relative overflow-hidden rounded-lg py-1.5 text-xs font-medium transition-colors border"
                                    style={{
                                      backgroundColor: language === lang ? `${colors.accent}15` : 'transparent',
                                      borderColor: language === lang ? `${colors.accent}30` : 'transparent',
                                      color: language === lang ? colors.accent : `${colors.text}60`
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    whileHover={{ backgroundColor: language === lang ? `${colors.accent}20` : 'rgba(255,255,255,0.05)' }}
                                  >
                                    {lang.toUpperCase()}
                                  </motion.button>
                                ))}
                             </div>
                          </div>

                          <motion.button
                            onClick={() => {
                              onLogout()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group mt-1"
                            whileHover={{ x: 4 }}
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div
                              className="p-2.5 rounded-xl"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              <LogOut className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="text-left flex-1">
                              <span className="text-red-400 font-medium block">{t('header.logout')}</span>
                              <span className="text-xs text-white/50">{t('header.exitAccount')}</span>
                            </div>
                            <ChevronDown
                              className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-50 transition-opacity text-red-400"
                            />
                          </motion.button>
                        </div>
                        <div
                          className="h-1"
                          style={{
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
                          }}
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border-2 transition-all duration-300"
                style={{
                  backgroundColor: mobileMenuOpen ? `${colors.primary}15` : 'transparent',
                  borderColor: mobileMenuOpen ? colors.borderActive : colors.border
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" style={{ color: colors.accent }} />
                  ) : (
                    <Menu className="h-5 w-5" style={{ color: `${colors.text}80` }} />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Renderizar menú móvil con Portal */}
      {mounted && createPortal(mobileMenuContent, document.body)}
    </>
  )
}
