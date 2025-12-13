'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Edit3, LogOut, Building2, MapPin, Globe, Mail, Phone } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { hexToRgb } from '../utils/styles'

interface BusinessPanelHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function BusinessPanelHeader({ onMenuClick, title, isCollapsed, onToggleCollapse }: BusinessPanelHeaderProps) {
  // Validar que las funciones requeridas estén presentes
  if (!onMenuClick || typeof onMenuClick !== 'function') {
    console.error('BusinessPanelHeader: onMenuClick debe ser una función')
    return null
  }

  const { styles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { user, logout } = useAuth()
  const { userProfile } = useUserProfile()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [orgInfoOpen, setOrgInfoOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const orgInfoRef = useRef<HTMLDivElement>(null)

  const organization = businessData?.organization

  // Calcular estilos del navbar basados en los estilos personalizados
  const navbarStyle = useMemo(() => {
    if (!styles?.panel) {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'rgba(71, 85, 105, 0.3)',
        color: undefined as string | undefined
      }
    }

    const panelStyles = styles.panel
    const sidebarBg = panelStyles?.sidebar_background || '#0f172a'
    const sidebarOpacity = panelStyles?.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor = panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)'
    const textColor = panelStyles?.text_color

    // Convertir hex a rgba si es necesario
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
  }, [styles?.panel])

  // Funciones para obtener información del usuario
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

  const handleProfileClick = () => {
    router.push('/profile')
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    if (logout && typeof logout === 'function') {
      await logout()
    }
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (orgInfoRef.current && !orgInfoRef.current.contains(event.target as Node)) {
        setOrgInfoOpen(false)
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
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo y Nombre de la Empresa */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0"
              style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
            >
              <Menu className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-3 flex-1 min-w-0"
              ref={orgInfoRef}
            >
              {/* Icono de la Empresa (Favicon) */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative h-12 w-12 rounded-xl overflow-hidden ring-1 transition-all flex-shrink-0 cursor-pointer shadow-sm"
                style={{
                  ringColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onClick={() => setOrgInfoOpen(!orgInfoOpen)}
              >
                {(organization?.brand_favicon_url || organization?.favicon_url || organization?.brand_logo_url || organization?.logo_url) ? (
                  <Image
                    src={organization?.brand_favicon_url || organization?.favicon_url || organization?.brand_logo_url || organization?.logo_url || '/icono.png'}
                    alt={organization?.name || 'Organización'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))'
                    }}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                )}
              </motion.div>

              {/* Nombre y Datos de la Empresa */}
              <div 
                className="hidden sm:block min-w-0 flex-1 cursor-pointer"
                onClick={() => setOrgInfoOpen(!orgInfoOpen)}
              >
                <motion.h1 
                  className="text-base sm:text-lg font-semibold leading-tight truncate"
                  style={{ 
                    color: navbarStyle.color || 'rgba(255, 255, 255, 0.95)'
                  }}
                  whileHover={{ opacity: 0.8 }}
                >
                  {organization?.name || 'Mi Organización'}
                </motion.h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {organization?.website_url && (
                    <motion.div
                      className="flex items-center gap-1 text-xs opacity-70"
                      style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.7)' }}
                      whileHover={{ opacity: 1 }}
                    >
                      <Globe className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{organization.website_url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                    </motion.div>
                  )}
                  {organization?.subscription_plan && (
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--org-primary-button-color, rgba(59, 130, 246, 0.2))',
                        color: 'var(--org-primary-button-color, #3b82f6)'
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="truncate">{organization.subscription_plan}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Desktop User Menu */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: userDropdownOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="h-9 w-9 rounded-full flex items-center justify-center ring-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))',
                    ringColor: 'rgba(255, 255, 255, 0.2)'
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
                <div className="text-left hidden lg:block">
                  <p 
                    className="text-sm font-medium leading-none"
                    style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.95)' }}
                  >
                    {getDisplayName()}
                  </p>
                  <p 
                    className="text-xs mt-0.5 opacity-70 leading-none"
                    style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {userProfile?.email || user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                </div>
                <ChevronDown 
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ 
                    color: navbarStyle.color || 'rgba(255, 255, 255, 0.6)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </motion.button>

              {/* Dropdown de Usuario */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
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
                              {userProfile?.email || user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1.5">
                        <motion.button
                          onClick={handleProfileClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: navbarStyle.color || undefined }}
                          whileHover={{ x: 2 }}
                        >
                          <Edit3 className="h-4 w-4" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                          <span>Editar perfil</span>
                        </motion.button>

                        <div 
                          className="h-px my-1.5 mx-4" 
                          style={{ backgroundColor: navbarStyle.borderColor }}
                        />

                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:opacity-80 transition-colors"
                          whileHover={{ x: 2 }}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar sesión</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: navbarStyle.color || 'rgba(255, 255, 255, 0.8)' }}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown de Información de la Organización */}
      <AnimatePresence>
        {orgInfoOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t backdrop-blur-xl"
            style={{
              backgroundColor: navbarStyle.backgroundColor,
              borderColor: navbarStyle.borderColor,
            }}
          >
            <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {organization?.description && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <p 
                      className="text-sm opacity-80 leading-relaxed"
                      style={{ color: navbarStyle.color || undefined }}
                    >
                      {organization.description}
                    </p>
                  </div>
                )}
                {organization?.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 opacity-60" style={{ color: navbarStyle.color || undefined }} />
                    <a
                      href={`mailto:${organization.contact_email}`}
                      className="text-sm hover:opacity-80 transition-opacity truncate"
                      style={{ color: navbarStyle.color || undefined }}
                    >
                      {organization.contact_email}
                    </a>
                  </div>
                )}
                {organization?.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 opacity-60" style={{ color: navbarStyle.color || undefined }} />
                    <a
                      href={`tel:${organization.contact_phone}`}
                      className="text-sm hover:opacity-80 transition-opacity"
                      style={{ color: navbarStyle.color || undefined }}
                    >
                      {organization.contact_phone}
                    </a>
                  </div>
                )}
                {organization?.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 opacity-60" style={{ color: navbarStyle.color || undefined }} />
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:opacity-80 transition-opacity truncate"
                      style={{ color: navbarStyle.color || undefined }}
                    >
                      {organization.website_url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  </div>
                )}
                {organization?.subscription_status && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: organization.subscription_status === 'active' 
                          ? 'var(--org-secondary-button-color, #10b981)' 
                          : '#ef4444'
                      }}
                    />
                    <span 
                      className="text-sm capitalize"
                      style={{ color: navbarStyle.color || undefined }}
                    >
                      {organization.subscription_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t backdrop-blur-xl overflow-hidden"
            style={{
              backgroundColor: navbarStyle.backgroundColor,
              borderColor: navbarStyle.borderColor,
            }}
          >
            <div className="px-4 py-4 space-y-3">
              <div 
                className="flex items-center gap-3 pb-3 border-b"
                style={{ borderColor: navbarStyle.borderColor }}
              >
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
                <div>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {getDisplayName()}
                  </p>
                  <p 
                    className="text-xs opacity-70"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {userProfile?.email || user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: navbarStyle.color || undefined }}
              >
                <Edit3 className="h-4 w-4" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                <span>Editar perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-lg hover:opacity-80 transition-opacity"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
