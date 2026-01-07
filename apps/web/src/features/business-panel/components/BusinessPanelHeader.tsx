'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, Building2, User, LayoutDashboard, Globe, ChevronRight, Check, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { hexToRgb } from '../utils/styles'
import { useLanguage } from '../../../core/providers/I18nProvider'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../../core/stores/themeStore'

interface BusinessPanelHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function BusinessPanelHeader({ onMenuClick }: BusinessPanelHeaderProps) {
  if (!onMenuClick || typeof onMenuClick !== 'function') {
    console.error('BusinessPanelHeader: onMenuClick debe ser una función')
    return null
  }

  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { user, logout } = useAuth()
  const { userProfile } = useUserProfile()
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(['business', 'common'])
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageOptions = [
    { value: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { value: 'en' as const, label: 'English', flag: '🇺🇸' },
    { value: 'pt' as const, label: 'Português', flag: '🇧🇷' },
  ]

  const organization = businessData?.organization

  // Calcular estilos del navbar
  const navbarStyle = useMemo(() => {
    // Usar estilos efectivos (light/dark) o fallback a estilos base
    const panelStyles = effectiveStyles?.panel || styles?.panel

    if (!panelStyles) {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'rgba(71, 85, 105, 0.3)',
        color: undefined as string | undefined
      }
    }

    const sidebarBg = panelStyles?.sidebar_background || '#0f172a'
    const sidebarOpacity = panelStyles?.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor = panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)'
    const textColor = panelStyles?.text_color

    let backgroundColor: string
    if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      backgroundColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('rgba')) {
      const rgbaMatch = sidebarBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${sidebarOpacity})`
        } else {
          backgroundColor = sidebarBg
        }
      } else {
        backgroundColor = sidebarBg
      }
    } else {
      backgroundColor = sidebarBg || 'rgba(15, 23, 42, 0.85)'
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor
    }
  }, [styles, effectiveStyles])

  const getDisplayName = () => {
    return userProfile?.display_name ||
      userProfile?.first_name ||
      user?.display_name ||
      user?.username ||
      'Usuario'
  }

  const getInitials = () => {
    const name = getDisplayName()
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    if (logout && typeof logout === 'function') {
      await logout()
    }
    setUserDropdownOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      style={{
        backgroundColor: navbarStyle.backgroundColor,
        borderColor: navbarStyle.borderColor,
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo y Nombre */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {/* Logo */}
              {/* Logo */}
              <div className="relative flex items-center justify-center">
                {(organization?.brand_favicon_url || organization?.favicon_url) ? (
                  <Image
                    src={organization?.brand_favicon_url || organization?.favicon_url || '/icono.png'}
                    alt={organization?.name || 'Organización'}
                    width={40}
                    height={40}
                    className="object-contain h-10 w-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                ) : (
                  <div
                    className="h-9 w-9 flex items-center justify-center rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))'
                    }}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Nombre de la Organización */}
              <h1
                className="hidden sm:block text-sm font-semibold truncate max-w-[200px]"
                style={{
                  color: navbarStyle.color || 'rgba(255, 255, 255, 0.95)'
                }}
              >
                {organization?.name || t('business:header.myOrganization')}
              </h1>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-center p-1 rounded-full transition-all duration-200"
              style={{
                backgroundColor: userDropdownOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center ring-2 ring-white/20 transition-all shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))',
                }}
              >
                {userProfile?.profile_picture_url || user?.profile_picture_url ? (
                  <Image
                    src={userProfile?.profile_picture_url || user?.profile_picture_url || ''}
                    alt={getDisplayName()}
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-white">
                    {getInitials()}
                  </span>
                )}
              </div>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {userDropdownOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
                    onClick={() => {
                      setUserDropdownOpen(false)
                      setActiveSubmenu(null)
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
                    style={{
                      backgroundColor: navbarStyle.backgroundColor,
                      borderColor: navbarStyle.borderColor,
                    }}
                  >
                    {/* User Info */}
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: navbarStyle.borderColor }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center ring-2"
                          style={{
                            background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))',
                            ringColor: 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          {userProfile?.profile_picture_url || user?.profile_picture_url ? (
                            <Image
                              src={userProfile?.profile_picture_url || user?.profile_picture_url || ''}
                              alt={getDisplayName()}
                              width={40}
                              height={40}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {getInitials()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: navbarStyle.color || undefined }}
                          >
                            {getDisplayName()}
                          </p>
                          <p
                            className="text-xs truncate opacity-70"
                            style={{ color: navbarStyle.color || undefined }}
                          >
                            Administrador
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5">
                      <motion.button
                        onClick={() => {
                          router.push(`/${orgSlug}/business-user/dashboard`)
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
                        whileHover={{ x: 2 }}
                      >
                        <LayoutDashboard className="h-4 w-4 opacity-70" />
                        <span>{t('business:header.userPanel')}</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          router.push('/auth/select-organization')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
                        whileHover={{ x: 2 }}
                      >
                        <Building2 className="h-4 w-4 opacity-70" />
                        <span>Mis organizaciones</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          router.push('/profile')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
                        whileHover={{ x: 2 }}
                      >
                        <User className="h-4 w-4 opacity-70" />
                        <span>{t('business:header.editProfile')}</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
                        whileHover={{ x: 2 }}
                      >
                        {resolvedTheme === 'dark' ? (
                          <Sun className="h-4 w-4 opacity-70" />
                        ) : (
                          <Moon className="h-4 w-4 opacity-70" />
                        )}
                        <span>{resolvedTheme === 'dark' ? t('common:menu.theme.light') : t('common:menu.theme.dark')}</span>
                      </motion.button>

                      <div className="relative">
                        <motion.button
                          onClick={() => setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                          style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
                          whileHover={{ x: 2 }}
                        >
                          <Globe className="h-4 w-4 opacity-70" />
                          <span className="flex-1 text-left">{t('common:language')}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{languageOptions.find(l => l.value === language)?.flag}</span>
                            <ChevronRight 
                              className={`h-3.5 w-3.5 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`}
                              style={{ opacity: 0.7 }} 
                            />
                          </div>
                        </motion.button>

                        <AnimatePresence>
                          {activeSubmenu === 'language' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-black/5"
                            >
                              {languageOptions.map((opt) => {
                                const isActive = language === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => { 
                                      setLanguage(opt.value)
                                      setActiveSubmenu(null)
                                    }}
                                    className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors hover:bg-white/5"
                                    style={{ color: isActive ? '#00D4B3' : (navbarStyle.color || 'rgba(255, 255, 255, 0.7)') }}
                                  >
                                    <span>{opt.flag}</span>
                                    <span>{opt.label}</span>
                                    {isActive && <Check className="h-3 w-3 ml-auto" />}
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="my-1 border-t border-white/10" />
                      <motion.button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:opacity-80 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('business:header.logout')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
